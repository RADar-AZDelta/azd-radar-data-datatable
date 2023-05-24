# Set a new version in package.json
# If this is your first time publishing, you will need to create an account with npmjs.com
# run pnpm adduser (npm adduser if you are using npm) and follow the prompts
rm -fr ./package
pnpm run package
pnpm publish ./package