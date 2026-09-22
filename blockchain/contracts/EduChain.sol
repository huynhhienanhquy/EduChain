// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract EduChain is Ownable {
    struct Course {
        uint256 id;
        string title;
        uint256 priceWei;
        uint256 coinRequired;
        bool active;
    }

    uint256 public nextCourseId = 1;

    mapping(uint256 => Course) public courses;
    mapping(address => mapping(uint256 => bool)) public ownedCourses;
    mapping(address => uint256[]) private userCourses;
    mapping(address => uint256) public rewardCoins;
    mapping(address => mapping(uint256 => string)) public certificateHashes;

    event CourseCreated(uint256 indexed courseId, string title, uint256 priceWei, uint256 coinRequired);
    event CourseBought(address indexed student, uint256 indexed courseId, uint256 paidWei);
    event CoinRewarded(address indexed student, uint256 amount);
    event CourseUnlockedByCoin(address indexed student, uint256 indexed courseId, uint256 coinsSpent);
    event CertificateIssued(address indexed student, uint256 indexed courseId, string certHash);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createCourse(
        string memory title,
        uint256 priceWei,
        uint256 coinRequired
    ) external onlyOwner returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(priceWei > 0, "Price must be > 0");

        uint256 courseId = nextCourseId;
        courses[courseId] = Course(courseId, title, priceWei, coinRequired, true);
        nextCourseId += 1;

        emit CourseCreated(courseId, title, priceWei, coinRequired);
        return courseId;
    }

    function buyCourse(uint256 courseId) external payable {
        Course memory course = courses[courseId];

        require(course.id != 0, "Course not found");
        require(course.active, "Course inactive");
        require(!ownedCourses[msg.sender][courseId], "Already owned");
        require(msg.value >= course.priceWei, "Insufficient payment");

        ownedCourses[msg.sender][courseId] = true;
        userCourses[msg.sender].push(courseId);

        (bool sent, ) = payable(owner()).call{value: msg.value}("");
        require(sent, "Transfer to owner failed");

        emit CourseBought(msg.sender, courseId, msg.value);
    }

    function rewardCoin(address student, uint256 amount) external onlyOwner {
        require(student != address(0), "Invalid student");
        require(amount > 0, "Amount must be > 0");

        rewardCoins[student] += amount;
        emit CoinRewarded(student, amount);
    }

    function unlockCourseByCoin(uint256 courseId) external {
        Course memory course = courses[courseId];

        require(course.id != 0, "Course not found");
        require(course.active, "Course inactive");
        require(!ownedCourses[msg.sender][courseId], "Already owned");
        require(rewardCoins[msg.sender] >= course.coinRequired, "Not enough coins");
rewardCoins[msg.sender] -= course.coinRequired;
        ownedCourses[msg.sender][courseId] = true;
        userCourses[msg.sender].push(courseId);

        emit CourseUnlockedByCoin(msg.sender, courseId, course.coinRequired);
    }

    function hasBoughtCourse(address student, uint256 courseId) external view returns (bool) {
        return ownedCourses[student][courseId];
    }

    function getMyCourses(address student) external view returns (uint256[] memory) {
        return userCourses[student];
    }

    function issueCertificate(
        address student,
        uint256 courseId,
        string memory certHash
    ) external onlyOwner {
        require(student != address(0), "Invalid student");
        require(courses[courseId].id != 0, "Course not found");
        require(ownedCourses[student][courseId], "Student does not own course");
        require(bytes(certHash).length > 0, "Certificate hash required");

        certificateHashes[student][courseId] = certHash;
        emit CertificateIssued(student, courseId, certHash);
    }
}
