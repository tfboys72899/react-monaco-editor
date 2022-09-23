const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const EncodingPlugin = require('webpack-encoding-plugin');

// const MonacoEditorSrc = path.join(__dirname, "..", "src");

module.exports = {
  entry: "./index.js",
  mode: "production",
  devtool: "source-map",
  output: {
    path: path.join(__dirname, "./lib/x"),
    filename: "[name].[hash].js",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
              plugins: ["@babel/plugin-proposal-class-properties"],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource'
      },
    ],
  },
  resolve: {
    extensions: [".js", ".json"],
    // Remove alias until https://github.com/microsoft/monaco-editor-webpack-plugin/issues/68 is fixed
    // alias: { "react-monaco-editor": MonacoEditorSrc }
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: ["json", "javascript", "typescript", "c", "cpp"],
    }),
    new HtmlWebpackPlugin({
      //指定模板
      template: "./index.html",
    }),
    new EncodingPlugin({
      encoding: 'UTF-8'
    }),
  ],
  devServer: { 
    contentBase: "./",
    port: 9991,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://10.11.24.117:9988/',
        pathRewrite:{
          '^/api':''
        }
      }
    }
  },
};
