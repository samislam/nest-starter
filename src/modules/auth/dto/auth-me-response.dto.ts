export interface AuthMeResponseDto {
  user: {
    sub: string
    name: string
    username: string
  }
}
