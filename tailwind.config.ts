import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
       
      },
      fontFamily: {
        'title': ['Oswald', "sans-serif"],
        'small-title': ['Poppins-SemiBold',"sans-serif"],
        'body': ['Roboto', "sans-serif"]
      },
      boxShadow: {
        '2xl': '8px 10px 20px -5px rgba(255, 255, 255, 0.9)',
      },
    },
  },
  plugins: [],
}
export default config
