export const landingPageCode = `// Verify the user's license key
async function checkUserLicense(){
  const licenseKey = "YOUR_LICENSE_KEY";

  // Send a request to the license server
  const response = await fetch({
    url: "https://api.example.com/check-license",
    method: "POST",
    body: JSON.stringify({ licenseKey })
  });
  const data = await response.json();

  // User does not have a valid license :(
  if (!data.licenseStatus) {
    alert("You do not have a valid license.");
    process.exit(1);
  }
}`;

export const defaultCode = `/**
 * GitHub: https://github.com/MichaelXF/js-confuser
 * NPM: https://www.npmjs.com/package/js-confuser
 *
 * Welcome to Js Confuser!
 *
 * You can obfuscate the code with the top right button 'Obfuscate'.
 *
 * You can customize the obfuscator with the button 'Options'.
 * (Set the target to 'node' for NodeJS apps)
 *
 * Version: 1.7.2
 *
 * Happy Hacking!
 */

function greet(name) {
  var output = 'Hello ' + name + '!';
  console.log(output);
}

greet('Internet User');`;

export const defaultOptionsJS = `module.exports = {
  preset: "medium",
  target: "browser",
};`;
