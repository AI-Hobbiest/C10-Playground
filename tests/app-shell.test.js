"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const nav=fs.readFileSync("js/app-shell.js","utf8");
const css=fs.readFileSync("css/app-shell.css","utf8");
const dashboard=fs.readFileSync("dashboard.html","utf8");
const homepage=fs.readFileSync("index.html","utf8");
const practice=fs.readFileSync("practice.html","utf8");
const profile=fs.readFileSync("profile.html","utf8");
const science=fs.readFileSync("science.html","utf8");

assert.ok(nav.includes('href:"./dashboard.html"'));
assert.ok(nav.includes('href:"./dashboard.html#rewards"'));
assert.ok(nav.includes('href:"./profile.html#profile"'));
assert.ok(nav.includes('href:"./profile.html#history"'));
assert.ok(nav.includes('href:"./profile.html#backup"'));
assert.ok(nav.includes('href:"./practice.html?subject=science"'),"Science menu opens the shared engine");
assert.ok(homepage.includes('practice.html?subject=science'),"homepage Science tile opens the shared engine");
assert.ok(nav.includes("aria-expanded"));
assert.ok(nav.includes('event.key==="Escape"'));
assert.ok(nav.includes('const file=last.includes(".")?last:"index.html"'),"GitHub Pages project root resolves as index");
assert.ok(css.includes("@media(max-width:900px)"));
assert.ok(css.includes(".c10-sidebar.open"));
assert.ok(css.includes(".c10-mobilebar{display:none}"),"mobile bar is hidden on desktop");
assert.ok(css.includes(".c10-nav-scrim.visible"));
assert.ok(css.includes("prefers-reduced-motion"));
for(const [name,html] of [["homepage",homepage],["practice",practice],["profile",profile]]) {
 assert.ok(html.includes("./css/app-shell.css"),name+" links shared navigation styles");
 assert.ok(html.includes("./js/app-shell.js"),name+" loads shared navigation behavior");
}
assert.ok(science.includes("practice.html?subject=science"),"Science compatibility page routes to the shared practice engine");
assert.ok(science.includes("window.location.replace"),"Science redirects promptly instead of loading the retired standalone module");
assert.ok(dashboard.includes("./css/app-shell.css"));
assert.ok(dashboard.includes("./js/app-shell.js"));
for(const section of ["dashboard","rewards"])assert.ok(dashboard.includes('id="'+section+'"'));
for(const field of ["profile","history","backup"])assert.ok(profile.includes('id="'+field+'"'));
new Function(nav);
console.log("Navigation tests passed: responsive shell on app pages, Science compatibility redirect, correct menu targets, keyboard closing, active root resolution, and dashboard/profile anchor contracts.");
