// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
    function name() external view returns (string memory);
}

contract MultiTokenSoftStaking {
    IERC20 public tpfToken; // Token base para verificar saldo (TPF)
    
    struct RewardToken {
        IERC20 token;           // Contrato do token de recompensa
        uint256 apyRate;        // APY específico para este token (basis points)
        bool isActive;          // Se o token está ativo para distribuição
        uint256 totalDistributed; // Total já distribuído deste token
        string name;            // Nome do token
        string symbol;          // Símbolo do token
    }
    
    struct UserRewardInfo {
        uint256 lastClaimTime; // Último claim para este token específico
        uint256 totalClaimed;  // Total já reclamado deste token
    }
    
    // Mapeamento: tokenId => RewardToken
    mapping(uint256 => RewardToken) public rewardTokens;
    
    // Mapeamento: user => tokenId => UserRewardInfo
    mapping(address => mapping(uint256 => UserRewardInfo)) public userRewards;
    
    // Mapeamento: user => dados gerais do usuário
    mapping(address => uint256) public userFirstInteraction;
    
    uint256 public nextTokenId = 1;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MIN_CLAIM_INTERVAL = 1 hours;
    
    address public owner;
    uint256 public totalUsers;
    
    // Arrays para facilitar iteração
    uint256[] public activeTokenIds;
    
    event RewardTokenAdded(uint256 indexed tokenId, address indexed tokenAddress, string name, string symbol, uint256 apyRate);
    event RewardTokenUpdated(uint256 indexed tokenId, uint256 newApyRate, bool isActive);
    event RewardsClaimed(address indexed user, uint256 indexed tokenId, uint256 amount, string tokenSymbol);
    event MultipleRewardsClaimed(address indexed user, uint256[] tokenIds, uint256[] amounts);
    event RewardsDeposited(uint256 indexed tokenId, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor(address _tpfToken) {
        tpfToken = IERC20(_tpfToken);
        owner = msg.sender;
    }
    
    // FUNÇÃO PARA ADICIONAR NOVOS TOKENS DE RECOMPENSA
    function addRewardToken(
        address _tokenAddress,
        uint256 _apyRate,
        string memory _name,
        string memory _symbol
    ) external onlyOwner returns (uint256) {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_apyRate <= 10000, "APY cannot exceed 100%");
        
        IERC20 newToken = IERC20(_tokenAddress);
        
        // Tentar obter informações do token automaticamente
        string memory tokenName = _name;
        string memory tokenSymbol = _symbol;
        
        try newToken.name() returns (string memory name) {
            if (bytes(tokenName).length == 0) tokenName = name;
        } catch {}
        
        try newToken.symbol() returns (string memory symbol) {
            if (bytes(tokenSymbol).length == 0) tokenSymbol = symbol;
        } catch {}
        
        uint256 tokenId = nextTokenId++;
        
        rewardTokens[tokenId] = RewardToken({
            token: newToken,
            apyRate: _apyRate,
            isActive: true,
            totalDistributed: 0,
            name: tokenName,
            symbol: tokenSymbol
        });
        
        activeTokenIds.push(tokenId);
        
        emit RewardTokenAdded(tokenId, _tokenAddress, tokenName, tokenSymbol, _apyRate);
        
        return tokenId;
    }
    
    // ATUALIZAR CONFIGURAÇÕES DE UM TOKEN
    function updateRewardToken(
        uint256 _tokenId,
        uint256 _newApyRate,
        bool _isActive
    ) external onlyOwner {
        require(rewardTokens[_tokenId].token != IERC20(address(0)), "Token does not exist");
        require(_newApyRate <= 10000, "APY cannot exceed 100%");
        
        rewardTokens[_tokenId].apyRate = _newApyRate;
        rewardTokens[_tokenId].isActive = _isActive;
        
        // Atualizar array de tokens ativos
        _updateActiveTokensArray();
        
        emit RewardTokenUpdated(_tokenId, _newApyRate, _isActive);
    }
    
    // CLAIM DE UM TOKEN ESPECÍFICO
    function claimRewards(uint256 _tokenId) external {
        address user = msg.sender;
        uint256 tpfBalance = tpfToken.balanceOf(user);
        
        require(tpfBalance > 0, "No TPF tokens in wallet");
        require(rewardTokens[_tokenId].isActive, "Token not active");
        require(canClaim(user, _tokenId), "Must wait before next claim");
        
        uint256 rewards = calculatePendingRewards(user, _tokenId);
        require(rewards > 0, "No rewards to claim");
        
        RewardToken storage rewardToken = rewardTokens[_tokenId];
        require(rewardToken.token.balanceOf(address(this)) >= rewards, "Insufficient reward tokens in contract");
        
        // Atualizar dados do usuário
        if (userFirstInteraction[user] == 0) {
            userFirstInteraction[user] = block.timestamp;
            totalUsers++;
        }
        
        userRewards[user][_tokenId].lastClaimTime = block.timestamp;
        userRewards[user][_tokenId].totalClaimed += rewards;
        rewardToken.totalDistributed += rewards;
        
        // Transferir recompensas
        require(rewardToken.token.transfer(user, rewards), "Reward transfer failed");
        
        emit RewardsClaimed(user, _tokenId, rewards, rewardToken.symbol);
    }
    
    // CLAIM DE TODOS OS TOKENS ATIVOS
    function claimAllRewards() external {
        address user = msg.sender;
        uint256 tpfBalance = tpfToken.balanceOf(user);
        
        require(tpfBalance > 0, "No TPF tokens in wallet");
        
        uint256[] memory claimedTokenIds = new uint256[](activeTokenIds.length);
        uint256[] memory claimedAmounts = new uint256[](activeTokenIds.length);
        uint256 claimedCount = 0;
        
        for (uint256 i = 0; i < activeTokenIds.length; i++) {
            uint256 tokenId = activeTokenIds[i];
            
            if (!canClaim(user, tokenId)) continue;
            
            uint256 rewards = calculatePendingRewards(user, tokenId);
            if (rewards == 0) continue;
            
            RewardToken storage rewardToken = rewardTokens[tokenId];
            if (rewardToken.token.balanceOf(address(this)) < rewards) continue;
            
            // Atualizar dados do usuário
            if (userFirstInteraction[user] == 0) {
                userFirstInteraction[user] = block.timestamp;
                totalUsers++;
            }
            
            userRewards[user][tokenId].lastClaimTime = block.timestamp;
            userRewards[user][tokenId].totalClaimed += rewards;
            rewardToken.totalDistributed += rewards;
            
            // Transferir recompensas
            require(rewardToken.token.transfer(user, rewards), "Reward transfer failed");
            
            claimedTokenIds[claimedCount] = tokenId;
            claimedAmounts[claimedCount] = rewards;
            claimedCount++;
            
            emit RewardsClaimed(user, tokenId, rewards, rewardToken.symbol);
        }
        
        require(claimedCount > 0, "No rewards to claim");
        
        // Redimensionar arrays para o tamanho correto
        uint256[] memory finalTokenIds = new uint256[](claimedCount);
        uint256[] memory finalAmounts = new uint256[](claimedCount);
        
        for (uint256 i = 0; i < claimedCount; i++) {
            finalTokenIds[i] = claimedTokenIds[i];
            finalAmounts[i] = claimedAmounts[i];
        }
        
        emit MultipleRewardsClaimed(user, finalTokenIds, finalAmounts);
    }
    
    // CALCULAR RECOMPENSAS PENDENTES PARA UM TOKEN
    function calculatePendingRewards(address _user, uint256 _tokenId) public view returns (uint256) {
        uint256 tpfBalance = tpfToken.balanceOf(_user);
        if (tpfBalance == 0 || !rewardTokens[_tokenId].isActive) {
            return 0;
        }
        
        uint256 lastClaim = userRewards[_user][_tokenId].lastClaimTime;
        if (lastClaim == 0) {
            lastClaim = block.timestamp - 1 days; // Primeiro claim considera 1 dia
        }
        
        uint256 timeElapsed = block.timestamp - lastClaim;
        if (timeElapsed == 0) {
            return 0;
        }
        
        uint256 apyRate = rewardTokens[_tokenId].apyRate;
        uint256 rewards = (tpfBalance * apyRate * timeElapsed) / (BASIS_POINTS * SECONDS_PER_YEAR);
        
        return rewards;
    }
    
    // CALCULAR RECOMPENSAS POR SEGUNDO PARA UM TOKEN
    function calculateRewardsPerSecond(address _user, uint256 _tokenId) public view returns (uint256) {
        uint256 tpfBalance = tpfToken.balanceOf(_user);
        if (tpfBalance == 0 || !rewardTokens[_tokenId].isActive) {
            return 0;
        }
        
        uint256 apyRate = rewardTokens[_tokenId].apyRate;
        uint256 rewardsPerSecond = (tpfBalance * apyRate) / (BASIS_POINTS * SECONDS_PER_YEAR);
        
        return rewardsPerSecond;
    }
    
    // OBTER TODAS AS RECOMPENSAS PENDENTES DO USUÁRIO
    function getAllPendingRewards(address _user) external view returns (
        uint256[] memory tokenIds,
        uint256[] memory pendingAmounts,
        string[] memory tokenSymbols
    ) {
        uint256 activeCount = activeTokenIds.length;
        tokenIds = new uint256[](activeCount);
        pendingAmounts = new uint256[](activeCount);
        tokenSymbols = new string[](activeCount);
        
        for (uint256 i = 0; i < activeCount; i++) {
            uint256 tokenId = activeTokenIds[i];
            tokenIds[i] = tokenId;
            pendingAmounts[i] = calculatePendingRewards(_user, tokenId);
            tokenSymbols[i] = rewardTokens[tokenId].symbol;
        }
    }
    
    // OBTER INFORMAÇÕES COMPLETAS DO USUÁRIO
    function getUserInfo(address _user) external view returns (
        uint256 tpfBalance,
        uint256 firstInteraction,
        uint256[] memory tokenIds,
        uint256[] memory pendingRewards,
        uint256[] memory totalClaimed,
        uint256[] memory lastClaimTimes,
        string[] memory tokenSymbols
    ) {
        tpfBalance = tpfToken.balanceOf(_user);
        firstInteraction = userFirstInteraction[_user];
        
        uint256 activeCount = activeTokenIds.length;
        tokenIds = new uint256[](activeCount);
        pendingRewards = new uint256[](activeCount);
        totalClaimed = new uint256[](activeCount);
        lastClaimTimes = new uint256[](activeCount);
        tokenSymbols = new string[](activeCount);
        
        for (uint256 i = 0; i < activeCount; i++) {
            uint256 tokenId = activeTokenIds[i];
            tokenIds[i] = tokenId;
            pendingRewards[i] = calculatePendingRewards(_user, tokenId);
            totalClaimed[i] = userRewards[_user][tokenId].totalClaimed;
            lastClaimTimes[i] = userRewards[_user][tokenId].lastClaimTime;
            tokenSymbols[i] = rewardTokens[tokenId].symbol;
        }
    }
    
    // VERIFICAR SE PODE FAZER CLAIM
    function canClaim(address _user, uint256 _tokenId) public view returns (bool) {
        if (userRewards[_user][_tokenId].lastClaimTime == 0) {
            return true; // Primeiro claim sempre permitido
        }
        
        return (block.timestamp - userRewards[_user][_tokenId].lastClaimTime) >= MIN_CLAIM_INTERVAL;
    }
    
    // OBTER LISTA DE TODOS OS TOKENS ATIVOS
    function getActiveTokens() external view returns (
        uint256[] memory tokenIds,
        address[] memory tokenAddresses,
        string[] memory names,
        string[] memory symbols,
        uint256[] memory apyRates,
        uint256[] memory totalDistributed
    ) {
        uint256 count = activeTokenIds.length;
        tokenIds = new uint256[](count);
        tokenAddresses = new address[](count);
        names = new string[](count);
        symbols = new string[](count);
        apyRates = new uint256[](count);
        totalDistributed = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = activeTokenIds[i];
            RewardToken memory rewardToken = rewardTokens[tokenId];
            
            tokenIds[i] = tokenId;
            tokenAddresses[i] = address(rewardToken.token);
            names[i] = rewardToken.name;
            symbols[i] = rewardToken.symbol;
            apyRates[i] = rewardToken.apyRate;
            totalDistributed[i] = rewardToken.totalDistributed;
        }
    }
    
    // DEPOSITAR TOKENS DE RECOMPENSA
    function depositRewards(uint256 _tokenId, uint256 _amount) external onlyOwner {
        require(rewardTokens[_tokenId].token != IERC20(address(0)), "Token does not exist");
        require(rewardTokens[_tokenId].token.transferFrom(msg.sender, address(this), _amount), "Deposit failed");
        
        emit RewardsDeposited(_tokenId, _amount);
    }
    
    // OBTER SALDO DE RECOMPENSAS NO CONTRATO
    function getRewardBalance(uint256 _tokenId) external view returns (uint256) {
        require(rewardTokens[_tokenId].token != IERC20(address(0)), "Token does not exist");
        return rewardTokens[_tokenId].token.balanceOf(address(this));
    }
    
    // SIMULAR RECOMPENSAS PARA UM PERÍODO
    function simulateRewards(address _user, uint256 _tokenId, uint256 _timeInSeconds) external view returns (uint256) {
        uint256 tpfBalance = tpfToken.balanceOf(_user);
        if (tpfBalance == 0 || !rewardTokens[_tokenId].isActive) {
            return 0;
        }
        
        uint256 apyRate = rewardTokens[_tokenId].apyRate;
        uint256 simulatedRewards = (tpfBalance * apyRate * _timeInSeconds) / (BASIS_POINTS * SECONDS_PER_YEAR);
        return simulatedRewards;
    }
    
    // FUNÇÕES ADMINISTRATIVAS
    function removeRewardToken(uint256 _tokenId) external onlyOwner {
        require(rewardTokens[_tokenId].token != IERC20(address(0)), "Token does not exist");
        
        rewardTokens[_tokenId].isActive = false;
        _updateActiveTokensArray();
    }
    
    function emergencyWithdraw(uint256 _tokenId) external onlyOwner {
        require(rewardTokens[_tokenId].token != IERC20(address(0)), "Token does not exist");
        
        IERC20 token = rewardTokens[_tokenId].token;
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner, balance), "Emergency withdraw failed");
    }
    
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
    
    // FUNÇÃO INTERNA PARA ATUALIZAR ARRAY DE TOKENS ATIVOS
    function _updateActiveTokensArray() internal {
        delete activeTokenIds;
        
        for (uint256 i = 1; i < nextTokenId; i++) {
            if (rewardTokens[i].isActive && rewardTokens[i].token != IERC20(address(0))) {
                activeTokenIds.push(i);
            }
        }
    }
    
    // HEALTH CHECK
    function healthCheck() external view returns (bool) {
        return address(tpfToken) != address(0) && activeTokenIds.length > 0;
    }
    
    // ESTATÍSTICAS GERAIS
    function getStats() external view returns (
        uint256 totalActiveTokens,
        uint256 totalUsersCount,
        address tpfTokenAddress
    ) {
        totalActiveTokens = activeTokenIds.length;
        totalUsersCount = totalUsers;
        tpfTokenAddress = address(tpfToken);
    }
}
