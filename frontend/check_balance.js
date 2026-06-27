import fs from 'fs';

function checkBalance(filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const stack = [];
    const pairs = { '{': '}', '[': ']', '(': ')' };
    const opens = Object.keys(pairs);
    const closes = Object.values(pairs);

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (opens.includes(char)) {
            stack.push({ char, pos: i });
        } else if (closes.includes(char)) {
            if (stack.length === 0) {
                console.log(`Unmatched closing ${char} at pos ${i}`);
                return false;
            }
            const top = stack.pop();
            if (pairs[top.char] !== char) {
                console.log(`Mismatched ${top.char} at pos ${top.pos} and ${char} at pos ${i}`);
                return false;
            }
        }
    }

    if (stack.length > 0) {
        const top = stack.pop();
        console.log(`Unmatched opening ${top.char} at pos ${top.pos}`);
        return false;
    }

    console.log(`${filename} is balanced.`);
    return true;
}

const files = [
    'src/pages/UserDashboard.jsx',
    'src/pages/EventBookingPage.jsx',
    'src/pages/AdminDashboard.jsx'
];

files.forEach(f => checkBalance(f));
