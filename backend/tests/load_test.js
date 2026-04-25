const autocannon = require('autocannon');

const url = 'http://localhost:3000/api/slots?date=2024-04-25'; // Test a GET route

const run = () => {
  const instance = autocannon({
    url,
    connections: 200, // 200 concurrent requests
    duration: 10,   // for 10 seconds
  }, (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Load Test Results:');
      console.log(`Total Requests: ${result.requests.total}`);
      console.log(`Average Latency: ${result.latency.average} ms`);
      console.log(`Throughput: ${result.throughput.average} bytes/sec`);
    }
  });

  autocannon.track(instance, { renderProgressBar: true });
};

console.log(`Running load test on ${url} with 200 concurrent connections...`);
run();
