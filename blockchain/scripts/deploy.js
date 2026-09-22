const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const EduChain = await hre.ethers.getContractFactory('EduChain');
  const contract = await EduChain.deploy(deployer.address);
  await contract.waitForDeployment();

  console.log('EduChain deployed to:', await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
