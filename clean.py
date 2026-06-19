import re

with open('video_transcript.en.vtt', 'r') as f:
    content = f.read()

# remove VTT tags
content = re.sub(r'<[^>]+>', '', content)
# remove timestamps
content = re.sub(r'\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}.*\n?', '', content)
content = re.sub(r'\n+', ' ', content)

with open('clean_transcript.txt', 'w') as f:
    f.write(content)
