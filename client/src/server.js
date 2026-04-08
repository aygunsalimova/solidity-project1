import axios from 'axios'

const server = axios.create({
  baseURL: 'http://localhost:3043'
})

export default server
