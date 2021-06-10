export default async function (ms = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
