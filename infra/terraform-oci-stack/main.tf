terraform {
  backend "local" {}

  required_providers {
    oci = {
      source = "oracle/oci"
    }
  }
}

provider "oci" {}

resource "oci_core_instance" "generated_oci_core_instance" {
  agent_config {
    is_management_disabled = "false"
    is_monitoring_disabled = "false"
    plugins_config {
      desired_state = "DISABLED"
      name          = "Vulnerability Scanning"
    }
    plugins_config {
      desired_state = "DISABLED"
      name          = "OS Management Hub Agent"
    }
    plugins_config {
      desired_state = "DISABLED"
      name          = "Management Agent"
    }
    plugins_config {
      desired_state = "ENABLED"
      name          = "Custom Logs Monitoring"
    }
    plugins_config {
      desired_state = "DISABLED"
      name          = "Compute RDMA GPU Monitoring"
    }
    plugins_config {
      desired_state = "ENABLED"
      name          = "Compute Instance Run Command"
    }
    plugins_config {
      desired_state = "ENABLED"
      name          = "Compute Instance Monitoring"
    }
    plugins_config {
      desired_state = "DISABLED"
      name          = "Compute HPC RDMA Auto-Configuration"
    }
    plugins_config {
      desired_state = "DISABLED"
      name          = "Compute HPC RDMA Authentication"
    }
    plugins_config {
      desired_state = "ENABLED"
      name          = "Cloud Guard Workload Protection"
    }
    plugins_config {
      desired_state = "DISABLED"
      name          = "Block Volume Management"
    }
    plugins_config {
      desired_state = "DISABLED"
      name          = "Bastion"
    }
  }
  availability_config {
    recovery_action = "RESTORE_INSTANCE"
  }
  availability_domain = "aiFK:SA-SAOPAULO-1-AD-1"
  compartment_id      = "ocid1.tenancy.oc1..aaaaaaaaz5rbzkxwx3s6ntgpkrw66j53rrtthq3cacnz7clubqtjhgj7g5cq"
  create_vnic_details {
    assign_ipv6ip             = "false"
    assign_private_dns_record = "true"
    assign_public_ip          = "true"
    subnet_id                 = oci_core_subnet.generated_oci_core_subnet.id
  }
  display_name = "mj-portafolio-vm"
  instance_options {
    are_legacy_imds_endpoints_disabled = "true"
  }
  is_pv_encryption_in_transit_enabled = "true"
  metadata = {
    "ssh_authorized_keys" = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFhc45kgR6l0jyTgK43upeU37/4Dq/2UUgJjcpRU9C3U terabyte10@DESKTOP-56M9CEQ"
  }
  shape = "VM.Standard.A1.Flex"
  shape_config {
    memory_in_gbs = "2"
    ocpus         = "1"
  }
  source_details {
    source_id   = "ocid1.image.oc1.sa-saopaulo-1.aaaaaaaa43t3wf6k4nqdvoeuqycqpz7bh64kvl2jndghclynmgyi4ijouqgq"
    source_type = "image"
  }
}

resource "oci_core_vcn" "generated_oci_core_vcn" {
  cidr_block     = "10.0.0.0/16"
  compartment_id = "ocid1.tenancy.oc1..aaaaaaaaz5rbzkxwx3s6ntgpkrw66j53rrtthq3cacnz7clubqtjhgj7g5cq"
  display_name   = "mj-portafolio-vcn"
  dns_label      = "vcn11211004"
}

resource "oci_core_subnet" "generated_oci_core_subnet" {
  cidr_block     = "10.0.0.0/24"
  compartment_id = "ocid1.tenancy.oc1..aaaaaaaaz5rbzkxwx3s6ntgpkrw66j53rrtthq3cacnz7clubqtjhgj7g5cq"
  display_name   = "mj-portafolio-public"
  dns_label      = "subnet11211004"
  route_table_id = oci_core_vcn.generated_oci_core_vcn.default_route_table_id
  vcn_id         = oci_core_vcn.generated_oci_core_vcn.id
}

resource "oci_core_internet_gateway" "generated_oci_core_internet_gateway" {
  compartment_id = "ocid1.tenancy.oc1..aaaaaaaaz5rbzkxwx3s6ntgpkrw66j53rrtthq3cacnz7clubqtjhgj7g5cq"
  display_name   = "Internet Gateway mj-portafolio-vcn"
  enabled        = "true"
  vcn_id         = oci_core_vcn.generated_oci_core_vcn.id
}

resource "oci_core_default_route_table" "generated_oci_core_default_route_table" {
  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.generated_oci_core_internet_gateway.id
  }
  manage_default_resource_id = oci_core_vcn.generated_oci_core_vcn.default_route_table_id
}
