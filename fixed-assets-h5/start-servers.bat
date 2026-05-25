@echo off 
start /MIN /SEPARATE node server\index.js 
start /MIN /SEPARATE npx vite --port 3003
