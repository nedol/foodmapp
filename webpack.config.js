const path = require('path');

const webpack = require('webpack'); //to access built-in plugins

const NODE_ENV = process.env.NODE_ENV || 'development';

<<<<<<< HEAD
=======
// var JavaScriptObfuscator = require('webpack-obfuscator');
>>>>>>> 8be24054e8e773ec3668dfcc4fd5e30bc3c673de

module.exports = {

    devtool: NODE_ENV ==='development'?'cheap-inline-module-source-map':false

    entry: {
<<<<<<< HEAD
        // 'supplier': __dirname+'/src/supplier/supplier.entry.js',
        // 'supplier_offer': __dirname+'/src/supplier/supplier.offer.frame.js',
        // 'supplier_profile':__dirname+'/src/supplier/profile.supplier.js',
        // 'supplier_settings':__dirname+'/src/supplier/supplier.settings.js',
        // 'supplier_customer_frame': __dirname+'/src/supplier/customer.frame.js',
        // // // //
        'deliver': __dirname+'/src/deliver/deliver.entry.js',
        'deliver_offer': __dirname+'/src/deliver/deliver.offer.frame.js',
        'deliver_settings':__dirname+'/src/deliver/deliver.settings.js',
        'deliver_profile':__dirname+'/src/deliver/profile.deliver.js',
        'deliver_supplier_frame': __dirname+'/src/deliver/supplier.offer.frame.js',
        // // // ,
        //  'customer': __dirname+'/src/customer/customer.entry.js',
        //  'customer_order': __dirname+'/src/customer/customer.order.frame.js',
        //  'customer_profile':__dirname+'/src/customer/profile.customer.js',
        //  'customer_cart':__dirname+'/src/customer/customer.cart.js',
        //  'customer_settings':__dirname+'/src/customer/customer.settings.js',

        'store_init': __dirname+'/src/store/init.store.js',
        'store_order': __dirname+'/src/store/store.order.js',

        // 'kolmit':  __dirname+'/src/kolmi/kolmit.js',
        //'import_worker': __dirname+'/src/workers/import.js',
        // 'callcenter': __dirname+'/src/kolmi/callcenter/callcenter'

        // ,'foodtruck_order':__dirname+'/src/foodtruck/foodtruck.order.js'
        // ,'customer_search':__dirname+'/src/search/customer.search.js'
=======
         'supplier': __dirname+'/src/supplier/supplier.entry.js'
         ,'supplier_offer': __dirname+'/src/supplier/supplier.offer.frame.js'
         ,'supplier_profile':__dirname+'/src/profile/profile.supplier.js'
         ,'supplier_settings':__dirname+'/src/supplier/supplier.settings.js'
         ,'supplier_customer_frame': __dirname+'/src/supplier/customer.frame.js'
        // ,
         'deliver': __dirname+'/src/deliver/deliver.entry.js'
         ,'deliver_offer': __dirname+'/src/deliver/deliver.offer.frame.js'
         ,'deliver_settings':__dirname+'/src/deliver/deliver.settings.js'
         ,'deliver_profile':__dirname+'/src/profile/profile.deliver.js'
         ,'deliver_customer_frame': __dirname+'/src/deliver/customer.frame.js'
        //
        'customer': __dirname+'/src/customer/customer.entry.js'
        ,'customer_order': __dirname+'/src/customer/customer.order.frame.js'
        ,'customer_profile':__dirname+'/src/profile/profile.customer.js'
        ,'customer_settings':__dirname+'/src/customer/customer.settings.js'
>>>>>>> 8be24054e8e773ec3668dfcc4fd5e30bc3c673de
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: '[name]'
    },

    module: {

    rules: [
            {
                test: /\.html$/,
                use: [
                    {
                        loader: 'html-loader',
                        options: {
                            minimize: true,
                            interpolation: false
                        }
                    }
                ]
            },
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
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            },
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
            jQuery: 'jquery'
            //, ol:'ol'
        }),
        new webpack.DefinePlugin({
            NODE_ENV: JSON.stringify(NODE_ENV),
            LANG: JSON.stringify('ru')
        }),
        new webpack.DefinePlugin({
            'process.browser': 'true'
        }),
<<<<<<< HEAD
        //new webpack.IgnorePlugin(/your_package_name_here/),
        // new HtmlWebpackPlugin({
        //    template: './dist/main.tmplt.html'
        // }),
        //, new webpack.optimize.CommonsChunkPlugin({
        //     name:'common'
        // })
        // new JavaScriptObfuscator({
        //     rotateUnicodeArray: true
        // }, ['supplier.js,customer.js'])
=======

        new webpack.NoEmitOnErrorsPlugin(),
        new ExtractTextPlugin('./src/html/css/main.css'),


>>>>>>> 8be24054e8e773ec3668dfcc4fd5e30bc3c673de
    ],
    resolve: {
        alias: {
            jquery: path.join(__dirname, 'node_modules/jquery/src/jquery'),
        },
    },
    externals: {

    }
};
