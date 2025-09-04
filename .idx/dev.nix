{ pkgs, ... }: {
  # The channel determines which package versions are available.
  channel = "stable-24.05"; 

  # A list of packages to install from the specified channel.
  packages = [
    pkgs.nodejs_20  # For running the Vite dev server
    pkgs.nodePackages.npm # For installing dependencies
  ];

  # A set of environment variables to define within the workspace.
  env = {};

  # VS Code extensions to install from the Open VSX Registry.
  idx = {
    extensions = [
      "dbaeumer.vscode-eslint", # Helps with code quality
      "esbenp.prettier-vscode", # For code formatting
      "csstools.postcss"      # Tailwind CSS support
    ];

    # Workspace lifecycle hooks.
    workspace = {
      # Runs when a workspace is first created.
      onCreate = {
        # Install Node.js dependencies
        npm-install = "npm install";
      };
      # Runs every time the workspace is (re)started.
      onStart = {
        # Start the development server
        dev-server = "npm run dev";
      };
    };

    # Configure a web preview for your application.
    previews = {
      enable = true;
      previews = {
        # The "web" preview will show our React app
        web = {
          command = ["npm", "run", "dev", "--", "--port", "$PORT"];
          manager = "web";
        };
      };
    };
  };
}
