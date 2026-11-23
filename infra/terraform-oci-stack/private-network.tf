resource "oci_core_route_table" "portfolio_private" {
  compartment_id = oci_core_vcn.generated_oci_core_vcn.compartment_id
  vcn_id         = oci_core_vcn.generated_oci_core_vcn.id
  display_name   = "mj-portafolio-private-routes"
}

resource "oci_core_security_list" "portfolio_private" {
  compartment_id = oci_core_vcn.generated_oci_core_vcn.compartment_id
  vcn_id         = oci_core_vcn.generated_oci_core_vcn.id
  display_name   = "mj-portafolio-private-security"
}

resource "oci_core_subnet" "portfolio_private" {
  compartment_id             = oci_core_vcn.generated_oci_core_vcn.compartment_id
  vcn_id                     = oci_core_vcn.generated_oci_core_vcn.id
  cidr_block                 = "10.0.2.0/24"
  display_name               = "mj-portafolio-private"
  prohibit_public_ip_on_vnic = true
  route_table_id             = oci_core_route_table.portfolio_private.id
  security_list_ids          = [oci_core_security_list.portfolio_private.id]
}
