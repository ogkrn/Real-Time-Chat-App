"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prismaclient_js_1 = require("./prismaclient.js");
async function main() {
    const users = await prismaclient_js_1.prisma.user.findMany();
    console.log(users);
}
main();
//# sourceMappingURL=index.js.map