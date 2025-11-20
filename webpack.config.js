// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'development', // Use 'production' for minified output
  entry: './src/main.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public', 'dist'),
  },
  devtool: 'source-map', // Helps with debugging in the browser
};
