cd /home/claude/heldenbuch
{ cat shell.html; echo '<script>'; cat data.js spells.js spells2.js calc.js hbclasses.js subs.js assets.js crests.js extra.js theme.js app.js; echo '</script>'; } > index.html
cat data.js spells.js spells2.js calc.js hbclasses.js subs.js assets.js crests.js extra.js theme.js app.js > /tmp/claude-0/all.js && node --check /tmp/claude-0/all.js && echo SYNTAX_OK; wc -c index.html
