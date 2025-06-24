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

contract WorldStaking {
    IERC20 public stakingToken;  // Token usado para fazer stake
    IERC20 public rewardToken;   // Token usado para pagar recompensas
    
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 lastClaimTime;
    }
    
    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public totalStaked;
    
    uint256 public apyRate = 1200; // 12.00% (basis points: 10000 = 100%)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    
    address public owner;
    uint256 public totalStakedAmount;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event APYUpdated(uint256 oldAPY, uint256 newAPY);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        owner = msg.sender;
    }
    
    function stake(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(stakingToken.transferFrom(msg.sender, address(this), _amount), "Staking token transfer failed");
        
        // Claim pending rewards before updating stake
        if (stakes[msg.sender].amount > 0) {
            _claimRewards();
        }
        
        stakes[msg.sender].amount += _amount;
        stakes[msg.sender].timestamp = block.timestamp;
        stakes[msg.sender].lastClaimTime = block.timestamp;
        totalStakedAmount += _amount;
        
        emit Staked(msg.sender, _amount);
    }
    
    function unstake(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].amount >= _amount, "Insufficient staked amount");
        
        // Claim pending rewards before unstaking
        _claimRewards();
        
        stakes[msg.sender].amount -= _amount;
        totalStakedAmount -= _amount;
        
        if (stakes[msg.sender].amount == 0) {
            delete stakes[msg.sender];
        } else {
            stakes[msg.sender].lastClaimTime = block.timestamp;
        }
        
        require(stakingToken.transfer(msg.sender, _amount), "Staking token transfer failed");
        
        emit Unstaked(msg.sender, _amount);
    }
    
    function claimRewards() external {
        require(stakes[msg.sender].amount > 0, "No staked amount");
        _claimRewards();
    }
    
    function _claimRewards() internal {
        uint256 rewards = calculateRewards(msg.sender);
        if (rewards > 0) {
            stakes[msg.sender].lastClaimTime = block.timestamp;
            require(rewardToken.transfer(msg.sender, rewards), "Reward token transfer failed");
            emit RewardsClaimed(msg.sender, rewards);
        }
    }
    
    function calculateRewards(address _user) public view returns (uint256) {
        if (stakes[_user].amount == 0) {
            return 0;
        }
        
        uint256 timeStaked = block.timestamp - stakes[_user].lastClaimTime;
        uint256 rewards = (stakes[_user].amount * apyRate * timeStaked) / (BASIS_POINTS * SECONDS_PER_YEAR);
        
        return rewards;
    }
    
    function getStakeInfo(address _user) external view returns (uint256 amount, uint256 timestamp, uint256 pendingRewards) {
        amount = stakes[_user].amount;
        timestamp = stakes[_user].timestamp;
        pendingRewards = calculateRewards(_user);
    }
    
    function setAPY(uint256 _newAPY) external onlyOwner {
        require(_newAPY <= 10000, "APY cannot exceed 100%");
        uint256 oldAPY = apyRate;
        apyRate = _newAPY;
        emit APYUpdated(oldAPY, _newAPY);
    }
    
    function getCurrentAPY() external view returns (uint256) {
        return apyRate; // Returns in basis points (1200 = 12%)
    }
    
    // Emergency withdraw for both tokens
    function emergencyWithdrawStaking() external onlyOwner {
        uint256 balance = stakingToken.balanceOf(address(this));
        require(stakingToken.transfer(owner, balance), "Emergency withdraw staking failed");
    }
    
    function emergencyWithdrawRewards() external onlyOwner {
        uint256 balance = rewardToken.balanceOf(address(this));
        require(rewardToken.transfer(owner, balance), "Emergency withdraw rewards failed");
    }
    
    // Deposit reward tokens to the contract
    function depositRewards(uint256 _amount) external onlyOwner {
        require(rewardToken.transferFrom(msg.sender, address(this), _amount), "Reward token deposit failed");
    }
    
    // Check reward token balance in contract
    function getRewardBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }
    
    // Check staking token balance in contract
    function getStakingBalance() external view returns (uint256) {
        return stakingToken.balanceOf(address(this));
    }
    
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }
    
    // Get token addresses
    function getTokenAddresses() external view returns (address stakingTokenAddress, address rewardTokenAddress) {
        stakingTokenAddress = address(stakingToken);
        rewardTokenAddress = address(rewardToken);
    }
}
