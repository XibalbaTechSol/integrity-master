with open("integrity-cli/integrity_cli/main.py", "r") as f:
    lines = f.readlines()

out_lines = []
for line in lines:
    if line.strip() == 'if __name__ == "__main__":  # pragma: no cover' or line.strip() == 'app()':
        continue
    out_lines.append(line)

out_lines.append('\nif __name__ == "__main__":  # pragma: no cover\n')
out_lines.append('    app()\n')

with open("integrity-cli/integrity_cli/main.py", "w") as f:
    f.writelines(out_lines)
