const path = require('path');

const webpack = require('webpack'); //to access built-in plugins

var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {

    devtool: NODE_ENV ==='development'?'cheap-inline-module-source-map':null,
    //context: __dirname+'/js',

    entry: {
        //'jQuery':'jquery',
        // 'supplier':['babel-polyfill',
        //     __dirname+'/src/supplier/supplier_entry.js'
        // ],
        // 'user':['babel-polyfill',
        //     __dirname+'/src/user/user_entry.js'
        // ]
        'supplier': __dirname+'/src/supplier/supplier.entry.js'
        ,'customer': __dirname+'/src/customer/customer.entry.js'
        ,'supplier_profile':__dirname+'/src/profile/profile.supplier.js'
        ,'customer_profile':__dirname+'/src/profile/profile.customer.js'


    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: '[name]'
    },
    watch: NODE_ENV ==='development',
    watchOptions: {
        aggregateTimeout:100
    },
    module: {
        rules: [
            {
                test: /\.(jpe?g|png|gif)$/i,
                loader:"file-loader",
                query:{
                    name:'[name].[ext]',
                    outputPath:'images/'
                    //the images will be emmited to public/assets/images/ folder
                    //the images will be put in the DOM <style> tag as eg. background: url(assets/images/image.png);
                }
            },
            {
                test: /\.css$/,
                loaders: ["style-loader","css-loader"]
            }
        ],
        loaders:[
            { test: /\.css/, loader: "style-loader!css-loader" },
            { test: /\.less$/, loader: "style-loader!css-loader!less-loader" },
            //{ test: /\.jsx?$/, exclude: /(node_modules|bower_components)/, loader: 'babel?optional[]=runtime&stage=0'},
            { test: /\.png/, loader: "url-loader?limit=100000&mimetype=image/png" },
            { test: /\.gif/, loader: "url-loader?limit=100000&mimetype=image/gif" },
            { test: /\.jpg/, loader: "file-loader" },
            { test: /\.json/, loader: "json-loader" },
            { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }
        ],
    },
    plugins: [
        new webpack.ProvidePlugin({

            $: 'jquery',
            '$': 'jquery',
            jquery: 'jquery',
            jQuery: 'jquery',
            'window.jquery': 'jquery',
            'window.jQuery': 'jquery',
            ol:'ol'
        }),
        new webpack.DefinePlugin({
            NODE_ENV: JSON.stringify(NODE_ENV),
            LANG: JSON.stringify('ru')
        }),
        //new webpack.IgnorePlugin(/your_package_name_here/),
        // new HtmlWebpackPlugin({
        //    template: './dist/main.tmplt.html'
        // }),

        new webpack.NoEmitOnErrorsPlugin(),
        new ExtractTextPlugin('./src/html/css/main.css')

        //, new webpack.optimize.CommonsChunkPlugin({
        //     name:'common'
        // })
    ],
    resolve: {
        alias: {
            jquery: path.join(__dirname, 'node_modules/jquery/src/jquery'),
        },
    }
    ,
    externals: {

    }

};