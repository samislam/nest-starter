import { URL } from 'url'

/**
 * Formats a URL by ensuring it includes a protocol (`http://` if missing) and appending the
 * specified port.
 *
 * @example
 *   // Basic usage
 *   const formattedUrl = formatUrl('example.com', 3000)
 *   console.log(formattedUrl) // Outputs: 'http://example.com:3000'
 *
 * @example
 *   // When protocol is already included
 *   const formattedUrl = formatUrl('https://example.com', 443)
 *   console.log(formattedUrl) // Outputs: 'https://example.com:443'
 *
 * @param host The hostname or URL to format. It can include or omit a protocol.
 * @param port The port number to append to the URL.
 * @returns The formatted URL with the specified port.
 * @throws {TypeError} Throws an error if the `host` is invalid or cannot be parsed as a URL.
 */
export function formatUrl(host: string, port: number) {
  host = host.toLowerCase()

  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    host = `http://${host}`
  }

  const url = new URL(host)
  url.port = port.toString()

  return url.href
}
