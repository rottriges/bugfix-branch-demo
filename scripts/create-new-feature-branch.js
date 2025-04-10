#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function run() {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const currentVersion = packageJson.version;

  const [major, minor, _patch] = currentVersion.split(".").map(Number);
  const newMinor = minor + 1;
  const newVersion = `${major}.${newMinor}.0`;
  const newBranchName = `${newVersion}_newFeature`;

  console.log(`📦 Aktuelle Version: ${currentVersion}`);
  console.log(`✨ Neue Feature-Version: ${newVersion}`);
  console.log(`🌿 Neue Branch: ${newBranchName}`);

  try {
    execSync(`git checkout -b ${newBranchName}`, { stdio: "inherit" });

    packageJson.version = newVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

    execSync(`git add package.json`, { stdio: "inherit" });
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: "inherit" });

    execSync(`git push --set-upstream origin ${newBranchName}`, { stdio: "inherit" });

    const defaultTitle = `${newVersion}_newFeature --> beta`;
    const input = await ask(`📝 Titel für Pull Request [${defaultTitle}]: `);
    rl.close();
    const prTitle = input.trim() === "" ? defaultTitle : input.trim();

    const prBody = `Automatisch erstellter Feature-Branch für Version ${newVersion}.\n\nÄnderungen:\n- Neues Feature\n- Version in package.json angepasst\n`;

    execSync(
      `gh pr create --base beta --head ${newBranchName} --title "${prTitle}" --body "${prBody}"`,
      { stdio: "inherit" }
    );

    console.log("✅ Pull Request erfolgreich erstellt.");
  } catch (err) {
    console.error("❌ Fehler:", err.message);
    process.exit(1);
  }
}

run();

