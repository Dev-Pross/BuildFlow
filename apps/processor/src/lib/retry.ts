export async function retryLogic<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      if (attempt === maxRetries)
        throw Error("Max Retries Reached. Try again after some time");

      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying again with attempt ${attempt} after ${delay} ms`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw Error("Max Retries Reached. Try again after some time Technically this won't get executed but putting for the sake of making typescript happy ");
}
