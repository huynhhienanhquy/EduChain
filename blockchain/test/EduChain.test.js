import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('EduChain', function () {
  it('creates course, buys course, rewards coins and issues certificate', async function () {
    const [owner, student] = await ethers.getSigners();
    const EduChain = await ethers.getContractFactory('EduChain');
    const contract = await EduChain.deploy(owner.address);
    await contract.waitForDeployment();

    await contract.createCourse('Solidity Basics', ethers.parseEther('0.1'), 50);
    await contract.connect(student).buyCourse(1, { value: ethers.parseEther('0.1') });
    expect(await contract.hasBoughtCourse(student.address, 1)).to.equal(true);

    await contract.rewardCoin(student.address, 100);
    expect(await contract.rewardCoins(student.address)).to.equal(100n);

    await contract.issueCertificate(student.address, 1, 'ipfs://certificate-hash');
    expect(await contract.certificateHashes(student.address, 1)).to.equal('ipfs://certificate-hash');

    const courses = await contract.getMyCourses(student.address);
    expect(courses.map(Number)).to.deep.equal([1]);
  });
});
