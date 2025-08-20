const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        REACT_APP_API_URL: JSON.stringify(process.env.REACT_APP_API_URL || '/api') // Inject from .env or fallback
      }
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    compress: true, // Enable gzip compression for faster dev loading
    hot: true,
    open: true,
    port: 80,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'], // Proxy all /api/* requests to backend
        target: 'http://localhost:3001',
        changeOrigin: true, // Handle host header changes if needed
        secure: false // For local dev (ignore self-signed certs if any)
      }
    ],
    allowedHosts: 'all'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
