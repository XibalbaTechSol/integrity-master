#!/bin/bash
ids=$(himalaya -o json envelope list -s 10 "body unsubscribe" | jq -r '.[].id')
echo "| ID | Subject | Unsubscribe Link |"
echo "|---|---|---|"
for id in $ids; do
    subject=$(himalaya -o json message read $id | jq -r '.subject')
    link=$(himalaya message read $id | grep -oE 'https?://[a-zA-Z0-9./?=&_%-]+unsubscribe[a-zA-Z0-9./?=&_%-]+' | head -n 1)
    if [ -z "$link" ]; then
        link=$(himalaya message read $id | grep -oE 'https?://[a-zA-Z0-9./?=&_%-]+optout[a-zA-Z0-9./?=&_%-]+' | head -n 1)
    fi
    if [ -z "$link" ]; then
        link="Not found (check manually)"
    fi
    echo "| $id | $subject | $link |"
done
