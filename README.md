This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-wagmi`](https://github.com/wevm/wagmi/tree/main/packages/create-wagmi).

# [VoteToken.sol]

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VoteToken {
    string public name = "VoteChain Token";
    string public symbol = "VT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    address public owner;
    address public minter;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event MinterChanged(address indexed minter);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == minter, "Only minter");
        _;
    }

    function setMinter(address _minter) public onlyOwner {
        require(_minter != address(0), "Invalid minter");

        minter = _minter;

        emit MinterChanged(_minter);
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_to != address(0), "Invalid address");
        require(balanceOf[msg.sender] >= _value, "Not enough balance");

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        require(_spender != address(0), "Invalid spender");

        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool) {
        require(_from != address(0), "Invalid from");
        require(_to != address(0), "Invalid to");
        require(balanceOf[_from] >= _value, "Not enough balance");
        require(allowance[_from][msg.sender] >= _value, "Not enough allowance");

        allowance[_from][msg.sender] -= _value;
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(_from, _to, _value);

        return true;
    }

    function mint(address _to, uint256 _amount) public onlyMinter {
        require(_to != address(0), "Invalid address");

        totalSupply += _amount;
        balanceOf[_to] += _amount;

        emit Transfer(address(0), _to, _amount);
    }

    function burnFrom(address _from, uint256 _amount) public onlyMinter {
        require(_from != address(0), "Invalid address");
        require(balanceOf[_from] >= _amount, "Not enough balance");

        balanceOf[_from] -= _amount;
        totalSupply -= _amount;

        emit Transfer(_from, address(0), _amount);
    }
}


# [VotingPlatform.sol]

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVoteToken {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function mint(address to, uint256 amount) external;
    function burnFrom(address from, uint256 amount) external;
}

contract VotingPlatform {
    address public owner;
    uint256 public voteCount;

    IVoteToken public voteToken;

    uint256 public constant STARTER_TOKEN_AMOUNT = 100 ether;
    uint256 public constant CREATE_VOTE_COST = 100 ether;
    uint256 public constant VOTE_REWARD = 10 ether;

    mapping(address => bool) public claimedStarterTokens;

    struct VoteInfo {
        address creator;
        string title;
        string description;
        string category;
        string[] options;
        uint256[] counts;
        uint256 createdAt;
        uint256 deadline;
        bool showResultImmediately;
        bool isPrivate;
        bytes32 passwordHash;
        bool deleted;
    }

    mapping(uint256 => VoteInfo) private votes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    uint256[] private allVoteIds;
    mapping(address => uint256[]) private creatorVoteIds;

    event StarterTokensClaimed(address indexed user, uint256 amount);
    event TokensGranted(address indexed user, uint256 amount);
    event TokensRemoved(address indexed user, uint256 amount);

    event VoteCreated(
        uint256 indexed voteId,
        address indexed creator,
        string title,
        string category
    );

    event Voted(
        uint256 indexed voteId,
        address indexed voter,
        uint256 optionIndex,
        uint256 reward
    );

    event VoteDeleted(uint256 indexed voteId);

    constructor(address _voteToken) {
        owner = msg.sender;
        voteToken = IVoteToken(_voteToken);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can use this function");
        _;
    }

    modifier voteExists(uint256 _voteId) {
        require(_voteId < voteCount, "Vote does not exist");
        _;
    }

    modifier onlyCreatorOrOwner(uint256 _voteId) {
        require(
            msg.sender == votes[_voteId].creator || msg.sender == owner,
            "Only creator or owner can use this function"
        );
        _;
    }

    function claimStarterTokens() public {
        require(!claimedStarterTokens[msg.sender], "Already claimed starter tokens");

        claimedStarterTokens[msg.sender] = true;
        voteToken.mint(msg.sender, STARTER_TOKEN_AMOUNT);

        emit StarterTokensClaimed(msg.sender, STARTER_TOKEN_AMOUNT);
    }

    function grantTokens(address _user, uint256 _amount) public onlyOwner {
        require(_user != address(0), "Invalid user address");
        require(_amount > 0, "Amount must be greater than 0");

        voteToken.mint(_user, _amount);

        emit TokensGranted(_user, _amount);
    }

    function removeTokens(address _user, uint256 _amount) public onlyOwner {
        require(_user != address(0), "Invalid user address");
        require(_amount > 0, "Amount must be greater than 0");

        voteToken.burnFrom(_user, _amount);

        emit TokensRemoved(_user, _amount);
    }

    function createVote(
        string memory _title,
        string memory _description,
        string memory _category,
        string[] memory _options,
        uint256 _durationMinutes,
        bool _showResultImmediately,
        bool _isPrivate,
        string memory _password
    ) public {
        require(bytes(_title).length > 0, "Title is required");
        require(bytes(_description).length > 0, "Description is required");
        require(bytes(_category).length > 0, "Category is required");
        require(_options.length >= 2, "At least two options required");
        require(_durationMinutes >= 1, "Minimum duration is 1 minute");

        if (_isPrivate) {
            require(bytes(_password).length > 0, "Password is required");
        }

        for (uint256 i = 0; i < _options.length; i++) {
            require(bytes(_options[i]).length > 0, "Option cannot be empty");

            for (uint256 j = i + 1; j < _options.length; j++) {
                require(
                    keccak256(abi.encodePacked(_options[i])) !=
                        keccak256(abi.encodePacked(_options[j])),
                    "Duplicate option is not allowed"
                );
            }
        }

        bool paid = voteToken.transferFrom(
            msg.sender,
            address(this),
            CREATE_VOTE_COST
        );

        require(paid, "Token payment failed");

        uint256 newVoteId = voteCount;
        VoteInfo storage v = votes[newVoteId];

        v.creator = msg.sender;
        v.title = _title;
        v.description = _description;
        v.category = _category;
        v.createdAt = block.timestamp;
        v.deadline = block.timestamp + (_durationMinutes * 1 minutes);
        v.showResultImmediately = _showResultImmediately;
        v.isPrivate = _isPrivate;
        v.deleted = false;

        for (uint256 i = 0; i < _options.length; i++) {
            v.options.push(_options[i]);
            v.counts.push(0);
        }

        if (_isPrivate) {
            v.passwordHash = keccak256(abi.encodePacked(_password));
        }

        allVoteIds.push(newVoteId);
        creatorVoteIds[msg.sender].push(newVoteId);

        voteCount++;

        emit VoteCreated(newVoteId, msg.sender, _title, _category);
    }

    function vote(
        uint256 _voteId,
        uint256 _optionIndex,
        string memory _password
    ) public voteExists(_voteId) {
        VoteInfo storage v = votes[_voteId];

        require(!v.deleted, "Vote was deleted");
        require(block.timestamp < v.deadline, "Vote has ended");
        require(!hasVoted[_voteId][msg.sender], "Already voted");
        require(_optionIndex < v.options.length, "Invalid option");

        if (v.isPrivate) {
            require(
                v.passwordHash == keccak256(abi.encodePacked(_password)),
                "Wrong password"
            );
        }

        v.counts[_optionIndex]++;
        hasVoted[_voteId][msg.sender] = true;

        voteToken.mint(msg.sender, VOTE_REWARD);

        emit Voted(_voteId, msg.sender, _optionIndex, VOTE_REWARD);
    }

    function deleteVote(uint256 _voteId)
        public
        voteExists(_voteId)
        onlyCreatorOrOwner(_voteId)
    {
        require(!votes[_voteId].deleted, "Already deleted");

        votes[_voteId].deleted = true;

        emit VoteDeleted(_voteId);
    }

    function checkPassword(uint256 _voteId, string memory _password)
        public
        view
        voteExists(_voteId)
        returns (bool)
    {
        VoteInfo storage v = votes[_voteId];

        if (!v.isPrivate) {
            return true;
        }

        return v.passwordHash == keccak256(abi.encodePacked(_password));
    }

    function getVoteSummary(uint256 _voteId)
        public
        view
        voteExists(_voteId)
        returns (
            address creator,
            string memory title,
            string memory description,
            string memory category,
            uint256 createdAt,
            uint256 deadline,
            bool showResultImmediately,
            bool isPrivate,
            bool deleted,
            uint256 optionCount
        )
    {
        VoteInfo storage v = votes[_voteId];

        return (
            v.creator,
            v.title,
            v.description,
            v.category,
            v.createdAt,
            v.deadline,
            v.showResultImmediately,
            v.isPrivate,
            v.deleted,
            v.options.length
        );
    }

    function getOptions(uint256 _voteId)
        public
        view
        voteExists(_voteId)
        returns (string[] memory)
    {
        return votes[_voteId].options;
    }

    function getCounts(uint256 _voteId)
        public
        view
        voteExists(_voteId)
        returns (uint256[] memory)
    {
        VoteInfo storage v = votes[_voteId];

        require(!v.deleted, "Vote was deleted");

        if (!v.showResultImmediately) {
            require(
                block.timestamp >= v.deadline,
                "Results are hidden until voting ends"
            );
        }

        return v.counts;
    }

    function getCountsForCreator(uint256 _voteId)
        public
        view
        voteExists(_voteId)
        onlyCreatorOrOwner(_voteId)
        returns (uint256[] memory)
    {
        require(!votes[_voteId].deleted, "Vote was deleted");

        return votes[_voteId].counts;
    }

    function getAllVoteIds() public view returns (uint256[] memory) {
        return allVoteIds;
    }

    function getCreatorVoteIds(address _creator)
        public
        view
        returns (uint256[] memory)
    {
        return creatorVoteIds[_creator];
    }

    function isVoteActive(uint256 _voteId)
        public
        view
        voteExists(_voteId)
        returns (bool)
    {
        VoteInfo storage v = votes[_voteId];

        return !v.deleted && block.timestamp < v.deadline;
    }

    function canViewResults(uint256 _voteId)
        public
        view
        voteExists(_voteId)
        returns (bool)
    {
        VoteInfo storage v = votes[_voteId];

        if (v.deleted) {
            return false;
        }

        if (v.showResultImmediately) {
            return true;
        }

        return block.timestamp >= v.deadline;
    }
}
