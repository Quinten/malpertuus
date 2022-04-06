'use strict';

const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                modules: true
                            }
                        }
                    ],
                    include: /_.+\.css$/
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader'
                    ],
                    exclude: /_.+\.css$/
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif|mp3)$/i,
                    type: 'asset/resource',
                }
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: 'styles.css'
            }),
            new HtmlWebpackPlugin({
                ...config,
                chunks : ['index'],
                template: './src/index.html',
                filename: 'index.html'
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
