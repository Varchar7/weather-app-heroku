const fs = require('fs')
const http = require('http')
const requests = require('requests')
const { Navigator } = require('node-navigator')

let location = {
  latitude: 0,
  longitude: 0
}

const navigator = new Navigator()
navigator.geolocation.getCurrentPosition((success, error) => {
  if (error) console.error(error)
  else {
    location = {
      latitude: success.latitude,
      longitude: success.longitude
    }
    console.log(location)
  }
})

const webPage = fs.readFileSync('home.html', 'utf-8')
const errorPage = fs.readFileSync('not-found.html', 'utf-8')

function getCelsius (f) {
  return (f - 273.15).toFixed(2)
}

function modifyPage (file, values) {
  file = file.replace('{%temp%}', getCelsius(values.main.temp))
  file = file.replace('{%temp_min%}', getCelsius(values.main.temp_min))
  file = file.replace('{%temp_max%}', getCelsius(values.main.temp_max))
  file = file.replace('{%city%}', values.name)
  file = file.replace('{%country%}', values.sys.country)
  return file
}
server = http.createServer((request, response) => {
  if (request.url == '/') {
    requests(
      `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=35009007b265434de6f4bd7560b89a0f`
    )
      .on('data', chunk => {
        console.log(toWeather(chunk))
        let modify = [toWeather(chunk)]
        let finalResponse = modify
          .map(value => modifyPage(webPage, value))
          .join('')
        response.writeHead(200, { 'Content-type': 'text/html' })
        response.write(finalResponse)
      })
      .on('end', error => {
        if (error) console.log('Error')
        response.end()
      })
  } else {
    console.log(request.url)
    response.writeHead(404, { 'Content-type': 'text/html' })
    response.end(errorPage)
  }
})

server.listen(3000, '127.0.0.1')
function toWeather (json) {
  return JSON.parse(json)
}

function weatherToJson (value) {
  return JSON.stringify(value)
}

module.exports = {
  weatherToJson: weatherToJson,
  toWeather: toWeather
}
