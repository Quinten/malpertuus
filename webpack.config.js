'use strict';

const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const config = require('./package');

module.exports = (env, argv) => {

    const devMode = argv.mode !== 'production';

    let webpackConfig = {

        entry: {
            'index': './src/index.js'
        },

        output: {
            path: path.resolve(__dirname, 'public'),
            publicPath: '',
            clean: true
        },

        module: {
            rules: [
                {
                    test: [ /\.vert$/, /\.frag$/ ],
                    use: 'raw-loader'
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif|mp3)$/i,
                    type: 'asset/resource',
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                ...config,
                chunks : ['index'],
                template: './src/index.html',
                filename: 'index.html',
                minify: {
                    collapseWhitespace: true,
                    keepClosingSlash: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    useShortDoctype: true,
                    minifyCSS: true,
                    minifyJS: true
                }
            }),
            new CopyPlugin({
                patterns: [
                    {
                        from: 'src/assets/favicon.ico',
                        to: 'favicon.ico'
                    },
                    {
                        from: 'src/gif.js',
                        to: 'gif.js'
                    },
                    {
                        from: 'src/gif.worker.js',
                        to: 'gif.worker.js'
                    }
                ]
            })
        ],

        devServer: {
            static: "./public",
            host: "0.0.0.0",
            port: 3000
        }
    }

    if (!devMode) {

    }

    return webpackConfig;
};
