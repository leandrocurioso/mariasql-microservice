class GetFilesRecursively {

  constructor({ path, fileSystem }) {
    this.path = path;
    this.fileSystem = fileSystem;
  }

  execute(dir) {
      return this.fileSystem.readdirSync(dir).reduce((files, file) =>
      this.fileSystem.statSync(this.path.join(dir, file)).isDirectory() ?
          files.concat(this.execute(this.path.join(dir, file))) :
          files.concat(this.path.join(dir, file)), []);
  }

}

module.exports  = GetFilesRecursively;
