import { CommandModule } from 'yargs';

export const yargsCompletionCommand: CommandModule = {
  command: 'completion',
  describe:
    'Output shell completion script for bash, zsh, or fish. Run `nx completion --help` for installation instructions.',
  builder: (yargs) =>
    yargs
      .command(bashCompletionCommand)
      .command(zshCompletionCommand)
      .command(fishCompletionCommand)
      .demandCommand(1, 'Please specify a shell: bash, zsh, or fish.')
      .example('$0 completion bash >> ~/.bashrc', 'Enable bash completion')
      .example('$0 completion zsh >> ~/.zshrc', 'Enable zsh completion')
      .example(
        '$0 completion fish > ~/.config/fish/completions/nx.fish',
        'Enable fish completion'
      ),
  handler: async () => {},
};

function getNxCompletionCommand(): string {
  // Resolve the path to the nx binary that the user has installed.
  // We use `nx --get-yargs-completions` so the shell scripts call back
  // into the same yargs-based completion that works at dev time.
  try {
    const nxBin = require.resolve('nx/bin/nx.js');
    return `node "${nxBin}"`;
  } catch {
    // Fallback: assume `nx` is on PATH
    return 'nx';
  }
}

function generateBashScript(): string {
  const cmd = getNxCompletionCommand();
  return `###-begin-nx-completions-###
#
# nx command completion script
#
# Installation: nx completion bash >> ~/.bashrc
#    or: nx completion bash >> ~/.bash_profile
#
_nx_yargs_completions()
{
    local cur_word args type_list

    cur_word="\${COMP_WORDS[COMP_CWORD]}"
    args=("\${COMP_WORDS[@]}")

    type_list=$(${cmd} --get-yargs-completions "\${args[@]}" 2>/dev/null)

    COMPREPLY=( $(compgen -W "\${type_list}" -- \${cur_word}) )

    if [ \${#COMPREPLY[@]} -eq 0 ]; then
      COMPREPLY=()
    fi

    return 0
}
complete -o default -F _nx_yargs_completions nx
###-end-nx-completions-###
`;
}

function generateZshScript(): string {
  const cmd = getNxCompletionCommand();
  return `###-begin-nx-completions-###
#
# nx command completion script
#
# Installation: nx completion zsh >> ~/.zshrc
#    or: nx completion zsh > /usr/local/share/zsh/site-functions/_nx
#
if type compdef &>/dev/null; then
  _nx_yargs_completions () {
    local reply
    local si=$IFS
    IFS=$'\\n' reply=($(${cmd} --get-yargs-completions "\${words[@]}" 2>/dev/null))
    IFS=$si
    _describe 'values' reply
  }
  compdef _nx_yargs_completions nx
fi
###-end-nx-completions-###
`;
}

function generateFishScript(): string {
  const cmd = getNxCompletionCommand();
  return `###-begin-nx-completions-###
#
# nx command completion script for fish
#
# Installation: nx completion fish > ~/.config/fish/completions/nx.fish
#
complete -e -c nx

function __nx_yargs_completions
  set -l tokens (commandline -cop)
  set -l current (commandline -ct)
  ${cmd} --get-yargs-completions \$tokens "\$current" 2>/dev/null
end
complete -c nx -f -a '(__nx_yargs_completions)'
###-end-nx-completions-###
`;
}

const bashCompletionCommand: CommandModule = {
  command: 'bash',
  describe: 'Output bash completion script.',
  handler: () => {
    process.stdout.write(generateBashScript());
  },
};

const zshCompletionCommand: CommandModule = {
  command: 'zsh',
  describe: 'Output zsh completion script.',
  handler: () => {
    process.stdout.write(generateZshScript());
  },
};

const fishCompletionCommand: CommandModule = {
  command: 'fish',
  describe: 'Output fish completion script.',
  handler: () => {
    process.stdout.write(generateFishScript());
  },
};
