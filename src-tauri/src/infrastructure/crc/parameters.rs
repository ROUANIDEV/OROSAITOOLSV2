use crate::domain::crc::{
    CrcCalculationRequest,
    CrcNormalizedParameters,
};

#[derive(Debug, Clone)]
pub struct CrcParameters {
    pub width: u32,
    pub polynomial: u64,
    pub init: u64,
    pub xor_out: u64,
    pub reflect_in: bool,
    pub reflect_out: bool,
    pub mask: u64,
}

impl CrcParameters {
    pub fn from_request(
        request: &CrcCalculationRequest,
    ) -> Result<Self, String> {
        validate_width(request.width)?;

        let mask = build_mask(request.width);
        let polynomial = parse_numeric_parameter(&request.polynomial, "polynomial")?;
        let init = parse_numeric_parameter(&request.init, "init")?;
        let xor_out = parse_numeric_parameter(&request.xor_out, "xorOut")?;

        Ok(Self {
            width: request.width,
            polynomial: polynomial & mask,
            init: init & mask,
            xor_out: xor_out & mask,
            reflect_in: request.reflect_in,
            reflect_out: request.reflect_out,
            mask,
        })
    }

    pub fn normalized(&self) -> CrcNormalizedParameters {
        CrcNormalizedParameters {
            polynomial: format_hex(self.polynomial, self.width),
            init: format_hex(self.init, self.width),
            xor_out: format_hex(self.xor_out, self.width),
            reflected_polynomial: format_hex(
                reflect_bits(self.polynomial, self.width),
                self.width,
            ),
        }
    }
}

pub fn build_mask(width: u32) -> u64 {
    if width >= 64 {
        u64::MAX
    } else {
        (1u64 << width) - 1
    }
}

fn validate_width(width: u32) -> Result<(), String> {
    if width == 0 || width > 64 {
        return Err("CRC width must be between 1 and 64 bits.".to_string());
    }

    Ok(())
}

fn parse_numeric_parameter(value: &str, name: &str) -> Result<u64, String> {
    let trimmed = value.trim();

    if trimmed.is_empty() {
        return Err(format!("CRC {name} cannot be empty."));
    }

    let normalized = trimmed
        .strip_prefix("0x")
        .or_else(|| trimmed.strip_prefix("0X"))
        .unwrap_or(trimmed);

    u64::from_str_radix(normalized, 16).map_err(|error| {
        format!("Invalid CRC {name} value '{value}'. Expected hex: {error}")
    })
}

fn format_hex(value: u64, width: u32) -> String {
    let digits = ((width + 3) / 4) as usize;
    format!("0x{:0digits$X}", value)
}

fn reflect_bits(value: u64, width: u32) -> u64 {
    let mut result = 0u64;

    for index in 0..width {
        if ((value >> index) & 1) == 1 {
            result |= 1 << (width - 1 - index);
        }
    }

    result
}