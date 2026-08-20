import {
  B2BOrganizationRole,
  B2BOrganizationMemberStatus,
  type B2BOrganizationMember,
} from "@lib/api/types/b2b"

/**
 * Check if a member is active in an organization
 */
export function isActiveMember(member: B2BOrganizationMember): boolean {
  return member.status === B2BOrganizationMemberStatus.ACTIVE
}

/**
 * Check if a member has a specific role
 */
export function hasMemberRole(
  member: B2BOrganizationMember,
  role: B2BOrganizationRole
): boolean {
  return member.role === role && isActiveMember(member)
}

/**
 * Check if a member has any of the specified roles
 */
export function hasMemberAnyRole(
  member: B2BOrganizationMember,
  roles: B2BOrganizationRole[]
): boolean {
  return roles.some((role) => hasMemberRole(member, role)) && isActiveMember(member)
}

/**
 * Check if a member can approve purchase requests (OWNER or APPROVER role)
 */
export function canApprovePurchaseRequest(member: B2BOrganizationMember): boolean {
  return hasMemberAnyRole(member, [B2BOrganizationRole.OWNER, B2BOrganizationRole.APPROVER])
}

/**
 * Check if a member can submit purchase requests (BUYER role or higher)
 */
export function canSubmitPurchaseRequest(member: B2BOrganizationMember): boolean {
  return hasMemberAnyRole(member, [
    B2BOrganizationRole.OWNER,
    B2BOrganizationRole.APPROVER,
    B2BOrganizationRole.BUYER,
  ])
}

/**
 * Check if a member can view finance information (FINANCE role)
 */
export function canViewFinance(member: B2BOrganizationMember): boolean {
  return hasMemberRole(member, B2BOrganizationRole.FINANCE)
}

/**
 * Check if a member can view organization (any active role)
 */
export function canViewOrganization(member: B2BOrganizationMember): boolean {
  return isActiveMember(member)
}

/**
 * Get human-readable role label
 */
export function getRoleLabel(role: B2BOrganizationRole): string {
  const labels: Record<B2BOrganizationRole, string> = {
    [B2BOrganizationRole.OWNER]: "Owner",
    [B2BOrganizationRole.BUYER]: "Buyer",
    [B2BOrganizationRole.APPROVER]: "Approver",
    [B2BOrganizationRole.FINANCE]: "Finance",
    [B2BOrganizationRole.VIEWER]: "Viewer",
  }
  return labels[role]
}

/**
 * Get role description
 */
export function getRoleDescription(role: B2BOrganizationRole): string {
  const descriptions: Record<B2BOrganizationRole, string> = {
    [B2BOrganizationRole.OWNER]:
      "Full access to organization settings and approvals",
    [B2BOrganizationRole.BUYER]:
      "Can create and submit purchase requests",
    [B2BOrganizationRole.APPROVER]:
      "Can approve or reject purchase requests",
    [B2BOrganizationRole.FINANCE]:
      "Can review and approve orders for payment",
    [B2BOrganizationRole.VIEWER]:
      "Can view organization data only",
  }
  return descriptions[role]
}
