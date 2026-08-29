declare module 'autocannon' {
  interface Result {
    title?: string;
    url: string;
    connections: number;
    sampleInt: number;
    pipelining: number;
    duration: number;
    start: Date;
    finish: Date;
    errors: number;
    timeouts: number;
    mismatches: number;
    non2xx: number;
    resets: number;
    '1xx': number;
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
    statusCodeStats: Record<string, unknown>;
    latency: {
      average: number;
      mean: number;
      stddev: number;
      min: number;
      max: number;
      p2_5: number;
      p50: number;
      p75: number;
      p90: number;
      p97_5: number;
      p99: number;
      p99_9: number;
      p99_99: number;
      p99_999: number;
    };
    requests: {
      average: number;
      mean: number;
      stddev: number;
      min: number;
      max: number;
      total: number;
      p2_5: number;
      p50: number;
      p75: number;
      p90: number;
      p97_5: number;
      p99: number;
      p99_9: number;
      p99_99: number;
      p99_999: number;
    };
  }

  interface Options {
    url: string;
    connections?: number;
    duration?: number;
    pipelining?: number;
    [key: string]: unknown;
  }

  function autocannon(opts: Options, cb?: (err: Error | null, result: Result) => void): Promise<Result>;
  export default autocannon;
}
