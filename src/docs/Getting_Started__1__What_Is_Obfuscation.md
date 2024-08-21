#### What is obfuscation?

Obfuscation is the process of transforming code in a way that makes it
difficult to understand, while still maintaining its functionality. This is 
done by transforming the code in a way that makes it difficult for humans and automated tools to understand, 
but preserving the original functionality of the code.

##### Key Features

JS-Confuser provides the following features:

- Comment removal / minification
- Variable renaming
- Control Flow obfuscation
- String concealing
- Function obfuscation
- Locks (domainLock, date)
- Detect changes to source code

##### Basic examples

###### Comment removal / minification

This example has `Compact` enabled. This simply removes comments and whitespace from your code.

---{header: "Comment removal / minification"}
// Input.js
// Verify the user's license key
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
}

// Output.js
async function checkUserLicense(){const licenseKey='YOUR_LICENSE_KEY';const response=await fetch({['url']:'https://api.example.com/check-license',['method']:'POST',['body']:JSON['stringify']({['licenseKey']:licenseKey})});const data=await response['json']();if(!data['licenseStatus']){(alert('You do not have a valid license.'),process['exit'](1))}}
---

##### Rename Variables

This example has `Rename Variables` enabled, which changes all variable names in your code to randomized names. This is a 'one-way' function as the original names are permanently lost, making it a great obfuscation technique.

---{header: "Rename Variables"}
// Input.js
var twoSum = function (nums, target) {
  var hash = {};
  var len = nums.length;
  for (var i = 0; i < len; i++) {
    if (nums[i] in hash) return [hash[nums[i]], i];
    hash[target - nums[i]] = i;
  }
  return [-1, -1];
};

// Output.js
var _O2mOcF = function (kB4uXM, w_07HXS) {
  var ZLTJcx = {};
  var sXQOaUx = kB4uXM["length"];
  for (var JYYxEk = 0; JYYxEk < sXQOaUx; JYYxEk++) {
    if (kB4uXM[JYYxEk] in ZLTJcx) {
      return [ZLTJcx[kB4uXM[JYYxEk]], JYYxEk];
    }
    ZLTJcx[w_07HXS - kB4uXM[JYYxEk]] = JYYxEk;
  }
  return [-1, -1];
};
---

##### Control Flow Obfuscation

This example has `Control Flow Flattening` enabled. This obfuscation technique makes your code significantly harder to understand by altering its logical structure, however, it can severely decrease performance. Thus, it should be used sparingly.

---{header: "Control Flow Obfuscation"}
// Input.js
var startNum = 1
var endNum = 10;
for (var i = startNum; i <= endNum; i++ ) {
  console.log(i); // 1,2,3,4,5,6,7,8,9,10
}

// Output.js
function F7WDtP() {
}
var PsjyRaB = 577;
var MvfrABA = -549;
var sbQK04 = {
  'Q': () => {
    return PsjyRaB += -102;
  },
  'b': 1,
  'd': 'log',
  'Z': 4,
  'u': -70,
  't': function () {
    return sbQK04['s'](), MvfrABA += 63;
  },
  'w': function () {
    return (PsjyRaB == sbQK04['u'] ? Infinity : sbQK04)['b'];
  },
  'f': -120,
  'r': () => {
    F7WDtP((MvfrABA == -492 ? console : Object)[(sbQK04['f'] == -120 && sbQK04)['d']](sbQK04['d'] == 'log' ? dT7lmR : undefined), sbQK04['o']());
    return 'p';
  },
  's': function () {
    return PsjyRaB += 12;
  },
  'K': -3,
  'o': () => {
    return PsjyRaB += MvfrABA == (MvfrABA == sbQK04['j'] ? 'k' : 38) ? 'm' : 12, MvfrABA += 6;
  },
  'G': 589,
  'V': function () {
    return PsjyRaB = -(sbQK04['K'] == -3 ? 33 : sbQK04['U']);
  },
  'Y': function () {
    if (false) {
      F7WDtP(sbQK04['Q'](), MvfrABA += 17, sbQK04['e'] = true);
      return 'W';
    }
    F7WDtP(sbQK04['V'](), PsjyRaB *= 2, PsjyRaB -= MvfrABA + 1220, MvfrABA += 14);
    return 'W';
  },
  'B': 70,
  'P': function () {
    MvfrABA += MvfrABA == -486 ? -17 : sbQK04['M'];
    return 'N';
  },
  'j': 2,
  'R': 653,
  'x': -7
};
while (PsjyRaB + MvfrABA != 48) {
  switch (PsjyRaB + MvfrABA) {
  default:
    F7WDtP(MvfrABA = -sbQK04['Z'], MvfrABA += 21);
    break;
  case sbQK04['c'] ? -694 : 88:
    var DdeMGy = 10;
    var dT7lmR = sbQK04['f'] == 577 ? Boolean : QvL7Oc;
    PsjyRaB += 12;
    break;
  case 28:
    if (false) {
      sbQK04['t']();
      break;
    }
    var QvL7Oc = sbQK04['w']();
    F7WDtP(MvfrABA += 60, sbQK04['c'] = false);
    break;
  case 154:
    F7WDtP(console[(PsjyRaB == (sbQK04['B'] == 'C' ? sbQK04['E'] : 589) ? sbQK04 : setImmediate)['d']](dT7lmR), MvfrABA += -51);
    break;
  case 217:
    F7WDtP(delete sbQK04['K'], dT7lmR++, PsjyRaB += sbQK04['f'], MvfrABA += 3);
    break;
  case 356:
  case 705:
  case 103:
    F7WDtP(dT7lmR++, MvfrABA += sbQK04['K']);
    break;
  case 150:
    if (sbQK04['Y']() == 'W') {
      break;
    }
  case 644:
  case 85:
    sbQK04 = false;
    if (sbQK04['r']() == 'p') {
      break;
    }
  case 118:
    F7WDtP(MvfrABA *= sbQK04['b'] == 1 ? 2 : 19, MvfrABA -= PsjyRaB + -1096);
    break;
  case 957:
  case 873:
  case 411:
  case sbQK04['e'] ? 65 : -491:
    if (sbQK04['P']() == 'N') {
      break;
    }
  case 180:
  case 545:
    F7WDtP(dT7lmR++, PsjyRaB += sbQK04['j'] - -10, MvfrABA += PsjyRaB + -681);
    break;
  case 192:
  case 747:
  case 223:
  case 887:
    F7WDtP(MvfrABA = -109, PsjyRaB += -102, MvfrABA += -25, sbQK04['e'] = true);
    break;
  case 100:
    F7WDtP(sbQK04['a'] = dT7lmR <= (sbQK04['A'] = DdeMGy), MvfrABA += sbQK04['B']);
    break;
  case 170:
  case 849:
  case 186:
  case 777:
    if (sbQK04['a']) {
      MvfrABA += -52;
      break;
    }
    F7WDtP(PsjyRaB += -38, MvfrABA *= 2, MvfrABA -= -352, sbQK04['e'] = true);
    break;
  }
}
---

##### Pros / Cons

Code obfuscation has both it's pros and cons, so it's important to balance it according to your app's specific and security needs. JS-Confuser is highly configurable, allowing you to achieve the right level of protection without compromising on performance or maintainability.

###### Pros

- Protect intellectual property
- Prevent others from stealing your code
- Prevent modding your app
- Enforce client-side license checks 

###### Cons

- Significant performance reduction
- File size increase
- Can break your program

---

##### See also

- [Playground](./Playground)
- [FAQ](./faq)
- [Installation](./Installation)
