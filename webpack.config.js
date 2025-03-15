const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
require("dotenv").config();

module.exports = (env, argv) => {
   const mode = argv.mode || "development";
   return {
      mode: mode,
      entry: {
         index: "./src/index.ts",
         game: "./src/game.ts",
         callback: "./src/callback.ts"
      },
      module: {
         rules: [
            { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
            {
               test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
               type: "asset/resource",
               generator: { filename: "assets/[hash][ext][query]" }
            },
            { test: /\.tmx$/i, type: "asset/source" },
            {
               test: /\.css$/,
               use: ["style-loader", "css-loader"] // Process CSS
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
         filename: "[name].bundle.js",
         path: path.resolve(__dirname, "dist"),
         clean: true
      },
      plugins: [
         new HtmlWebpackPlugin({
            template: "src/index.html",
            filename: "index.html",
            chunks: ["index"]
         }),
         new HtmlWebpackPlugin({
            template: "src/callback.html",
            filename: "callback.html",
            chunks: ["callback"]
         }),
         new HtmlWebpackPlugin({
            template: "src/game.html",
            filename: "game.html",
            chunks: ["game"]
         }),
         new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify(mode),
            "process.env.AUTH_SERVER_URL": JSON.stringify(
               mode === "development"
                  ? "http://localhost:3000"
                  : env.AUTH_SERVER_URL || process.env.AUTH_SERVER_URL || "http://localhost:3000"
            ),
            "process.env.WEBSOCKET_URL": JSON.stringify(
               mode === "development"
                  ? "ws://localhost:8080"
                  : env.WEBSOCKET_URL || process.env.WEBSOCKET_URL || "ws://localhost:8080"
            )
         })
      ],
      devServer: {
         static: { directory: path.join(__dirname, "dist") },
         compress: true,
         port: 9000,
         historyApiFallback: {
            rewrites: [
               { from: /^\/$/, to: "/index.html" },
               { from: /^\/game.html$/, to: "/game.html" },
               { from: /^\/callback$/, to: "/callback.html" }
            ]
         }
      }
   };
};
