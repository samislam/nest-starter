import { PaginatedResponse } from '@/common/utils/pagination-helpers'

export interface UserDto {
  id: string
  name: string
  username: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type ListUsersResponseDto = PaginatedResponse<UserDto>
