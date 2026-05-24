const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'app', 'pages', 'Career.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace literal "\n" sequences with actual newline characters, but be careful not to replace legitimate \n inside strings.
// Since we only injected "\\n" for the patch, let's just do a global replace of '\\n' with '\n'
// Wait, replacing '\\n' globally might affect legitimate escaped newlines if any.
// Looking at Career.tsx, there are no intentional literal \n strings that shouldn't be actual newlines, except maybe in the patch string itself.
content = content.replace(/\\n/g, '\n');

fs.writeFileSync(file, content);
console.log('Fixed newlines');
