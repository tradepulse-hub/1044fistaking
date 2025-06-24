// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract SoftStaking {
    IERC20 public tpfToken;      // TPF Token para verificar saldo
    IERC20 public rewardToken;   // TradePulse Token (TPT) para recompensas
    
    struct UserInfo {
        uint256 lastClaimTime;
        uint256 totalClaimed;
    }
    
    mapping(address => UserInfo) public users;
    
    uint256 public apyRate = 100; // 1.00% APY (basis points: 10000 = 100%)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MIN_CLAIM_INTERVAL = 1 hours; // Mínimo 1 hora entre claims
    
    address public owner;
    uint256 public totalRewardsClaimed;
    
    event RewardsClaimed(address indexed user, uint256 amount, uint256 tpfBalance);
    event APYUpdated(uint256 oldAPY, uint256 newAPY);
    event RewardsDeposited(uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor(address _tpfToken, address _rewardToken) {
        tpfToken = IERC20(_tpfToken);
        rewardToken = IERC20(_rewardToken);
        owner = msg.sender;
    }
    
    function claimRewards() external {
        address user = msg.sender;
        uint256 tpfBalance = tpfToken.balanceOf(user);
        
        require(tpfBalance > 0, "No TPF tokens in wallet");
        require(canClaim(user), "Must wait before next claim");
        
        uint256 rewards = calculatePendingRewards(user);
        require(rewards > 0, "No rewards to claim");
        require(rewardToken.balanceOf(address(this)) >= rewards, "Insufficient reward tokens in contract");
        
        // Atualizar dados do usuário
        users[user].lastClaimTime = block.timestamp;
        users[user].totalClaimed += rewards;
        totalRewardsClaimed += rewards;
        
        // Transferir recompensas
        require(rewardToken.transfer(user, rewards), "Reward transfer failed");
        
        emit RewardsClaimed(user, rewards, tpfBalance);
    }
    
    function calculatePendingRewards(address _user) public view returns (uint256) {
        uint256 tpfBalance = tpfToken.balanceOf(_user);
        if (tpfBalance == 0) {
            return 0;
        }
        
        uint256 lastClaim = users[_user].lastClaimTime;
        if (lastClaim == 0) {
            lastClaim = block.timestamp - 1 days; // Se nunca fez claim, considera 1 dia de recompensas
        }
        
        uint256 timeElapsed = block.timestamp - lastClaim;
        if (timeElapsed == 0) {
            return 0;
        }
        
        // Cálculo: (saldo * APY * tempo) / (basis points * segundos por ano)
        uint256 rewards = (tpfBalance * apyRate * timeElapsed) / (BASIS_POINTS * SECONDS_PER_YEAR);
        
        return rewards;
    }
    
    function calculateRewardsPerSecond(address _user) public view returns (uint256) {
        uint256 tpfBalance = tpfToken.balanceOf(_user);
        if (tpfBalance == 0) {
            return 0;
        }
        
        // Recompensas por segundo: (saldo * APY) / (basis points * segundos por ano)
        uint256 rewardsPerSecond = (tpfBalance * apyRate) / (BASIS_POINTS * SECONDS_PER_YEAR);
        
        return rewardsPerSecond;
    }
    
    function getUserInfo(address _user) external view returns (
        uint256 tpfBalance,
        uint256 pendingRewards,
        uint256 lastClaimTime,
        uint256 totalClaimed
    ) {
        tpfBalance = tpfToken.balanceOf(_user);
        pendingRewards = calculatePendingRewards(_user);
        lastClaimTime = users[_user].lastClaimTime;
        totalClaimed = users[_user].totalClaimed;
    }
    
    function canClaim(address _user) public view returns (bool) {
        if (users[_user].lastClaimTime == 0) {
            return true; // Primeiro claim sempre permitido
        }
        
        return (block.timestamp - users[_user].lastClaimTime) >= MIN_CLAIM_INTERVAL;
    }
    
    function getCalculationDetails(address _user) external view returns (
        uint256 tpfBalance,
        uint256 currentAPY,
        uint256 timeElapsed,
        uint256 rewardsPerSecond,
        uint256 pendingRewards,
        bool canClaimNow
    ) {
        tpfBalance = tpfToken.balanceOf(_user);
        currentAPY = apyRate;
        
        uint256 lastClaim = users[_user].lastClaimTime;
        if (lastClaim == 0) {
            lastClaim = block.timestamp - 1 days;
        }
        timeElapsed = block.timestamp - lastClaim;
        
        rewardsPerSecond = calculateRewardsPerSecond(_user);
        pendingRewards = calculatePendingRewards(_user);
        canClaimNow = canClaim(_user);
    }
    
    function simulateRewards(address _user, uint256 _timeInSeconds) external view returns (uint256) {
        uint256 tpfBalance = tpfToken.balanceOf(_user);
        if (tpfBalance == 0) {
            return 0;
        }
        
        uint256 simulatedRewards = (tpfBalance * apyRate * _timeInSeconds) / (BASIS_POINTS * SECONDS_PER_YEAR);
        return simulatedRewards;
    }
    
    // Funções administrativas
    function setAPY(uint256 _newAPY) external onlyOwner {
        require(_newAPY <= 10000, "APY cannot exceed 100%");
        uint256 oldAPY = apyRate;
        apyRate = _newAPY;
        emit APYUpdated(oldAPY, _newAPY);
    }
    
    function getCurrentAPY() external view returns (uint256) {
        return apyRate; // Retorna em basis points (100 = 1%)
    }
    
    function depositRewards(uint256 _amount) external onlyOwner {
        require(rewardToken.transferFrom(msg.sender, address(this), _amount), "Reward token deposit failed");
        emit RewardsDeposited(_amount);
    }
    
    function getRewardBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }
    
    function getStats() external view returns (
        uint256 currentAPY,
        uint256 totalRewards,
        uint256 contractRewardBalance,
        uint256 totalUsers
    ) {
        currentAPY = apyRate;
        totalRewards = totalRewardsClaimed;
        contractRewardBalance = rewardToken.balanceOf(address(this));
        // totalUsers seria necessário implementar um contador separado
        totalUsers = 0; // Placeholder
    }
    
    // Funções de emergência
    function emergencyWithdrawRewards() external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        require(rewardToken.transfer(owner, balance), "Emergency withdraw failed");
    }
    
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
    
    // Getters para tokens
    function getTokenAddresses() external view returns (address tpfTokenAddress, address rewardTokenAddress) {
        tpfTokenAddress = address(tpfToken);
        rewardTokenAddress = address(rewardToken);
    }
    
    // Função para verificar se o contrato está funcionando
    function healthCheck() external view returns (bool) {
        return address(tpfToken) != address(0) && address(rewardToken) != address(0);
    }
}
