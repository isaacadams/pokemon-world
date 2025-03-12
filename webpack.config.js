const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
require("dotenv").config(); // Load .env file

module.exports = (env, argv) => ({
   mode: argv.mode || "development",
   entry: "./src/index.ts",
   module: {
      rules: [
         {
            test: /\.tsx?$/,
            use: "ts-loader",
            exclude: /node_modules/
         },
         {
            test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
            type: "asset/resource",
            generator: {
               filename: "assets/[hash][ext][query]"
            }
         },
         {
            test: /\.tmx$/i,
            type: "asset/source"
         }
      ]
   },
   resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
         "@assets": path.resolve(__dirname, "src/assets"),
         "@config": path.resolve(__dirname, "src/config")
      }
   },
   output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
      clean: true
   },
   plugins: [
      new HtmlWebpackPlugin({
         template: "src/index.html"
      }),
      new webpack.DefinePlugin({
         "process.env.NODE_ENV": JSON.stringify(argv.mode || "development"),
         "process.env.WEBSOCKET_URL": JSON.stringify(
            env.WEBSOCKET_URL || process.env.WEBSOCKET_URL || "ws://localhost:8080"
         )
      })
   ],
   devServer: {
      static: {
         directory: path.join(__dirname, "dist")
      },
      compress: true,
      port: 9000
   }
});
