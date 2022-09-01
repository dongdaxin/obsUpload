/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  collectCoverage: true,
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest",
    "^.+\\.(js|jsx)$": [
      "babel-jest",
      {
        presets: ["@babel/preset-env"],
        plugins: [["@babel/transform-runtime"]],
      },
    ],
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!(esdk-obs-browserjs))"],
};
