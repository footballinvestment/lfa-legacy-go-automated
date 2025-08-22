// CRACO configuration for memory optimization - AGGRESSIVE MODE
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // COMPLETELY DISABLE TypeScript checker 
      webpackConfig.plugins = webpackConfig.plugins.filter(
        plugin => {
          const name = plugin.constructor.name;
          return name !== 'ForkTsCheckerWebpackPlugin' && 
                 name !== 'TypeScriptWebpackPlugin' &&
                 !name.includes('TypeScript') &&
                 !name.includes('TSChecker');
        }
      );
      
      // Aggressive memory optimizations
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 10000,
          maxSize: 200000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 150000,
            },
            common: {
              minChunks: 2,
              chunks: 'all',
              maxSize: 100000,
            },
          },
        },
        // Reduce memory usage during compilation
        usedExports: false,
        sideEffects: false,
      };
      
      // Disable source maps in development for memory savings
      webpackConfig.devtool = false;
      
      // Set memory limits for webpack
      webpackConfig.stats = 'errors-only';
      
      return webpackConfig;
    },
  },
  typescript: {
    enableTypeChecking: false, // COMPLETELY disable TypeScript checking
  },
  babel: {
    presets: [
      [
        '@babel/preset-react',
        {
          runtime: 'automatic',
        },
      ],
    ],
  },
  devServer: {
    // Reduce memory usage in dev server
    compress: false,
    hot: false,
    liveReload: false,
  },
};