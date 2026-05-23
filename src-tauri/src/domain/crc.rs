use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CrcCalculationRequest {
    pub payload: String,
    pub input_format: String,
    pub width: u32,
    pub polynomial: String,
    pub init: String,
    pub xor_out: String,
    pub reflect_in: bool,
    pub reflect_out: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CrcCalculationResult {
    pub value: String,
    pub decimal: String,
    pub binary: String,
    pub bytes: usize,
    pub width: u32,
    pub mask: String,
    pub normalized: CrcNormalizedParameters,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CrcNormalizedParameters {
    pub polynomial: String,
    pub init: String,
    pub xor_out: String,
    pub reflected_polynomial: String,
}

#[derive(Debug, Clone)]
struct NormalizedCrcParameters {
    width: u32,
    polynomial: u128,
    reflected_polynomial: u128,
    init: u128,
    xor_out: u128,
    reflect_in: bool,
    reflect_out: bool,
    mask: u128,
    top_bit: u128,
}

pub fn calculate_crc_blocking(
    request: CrcCalculationRequest,
) -> Result<CrcCalculationResult, String> {
    let parameters = normalize_parameters(&request)?;
    let bytes = parse_input_bytes(&request.payload, &request.input_format)?;

    let mut register = if parameters.reflect_in {
        calculate_reflected(&bytes, &parameters)
    } else {
        calculate_normal(&bytes, &parameters)
    };

    if parameters.reflect_in != parameters.reflect_out {
        register = reflect(register, parameters.width);
    }

    let final_value = (register ^ parameters.xor_out) & parameters.mask;

    Ok(CrcCalculationResult {
        value: format_hex(final_value, parameters.width),
        decimal: final_value.to_string(),
        binary: format_binary(final_value, parameters.width),
        bytes: bytes.len(),
        width: parameters.width,
        mask: format_hex(parameters.mask, parameters.width),
        normalized: CrcNormalizedParameters {
            polynomial: format_hex(parameters.polynomial, parameters.width),
            init: format_hex(parameters.init, parameters.width),
            xor_out: format_hex(parameters.xor_out, parameters.width),
            reflected_polynomial: format_hex(
                parameters.reflected_polynomial,
                parameters.width,
            ),
        },
    })
}

fn calculate_normal(bytes: &[u8], parameters: &NormalizedCrcParameters) -> u128 {
    let mut register = parameters.init;

    for byte in bytes {
        let mut current_byte = *byte;

        for _ in 0..8 {
            let input_bit = (current_byte & 0x80) != 0;
            let register_top_bit = (register & parameters.top_bit) != 0;

            register = (register << 1) & parameters.mask;

            if register_top_bit != input_bit {
                register ^= parameters.polynomial;
            }

            current_byte = current_byte.wrapping_shl(1);
        }
    }

    register & parameters.mask
}

fn calculate_reflected(bytes: &[u8], parameters: &NormalizedCrcParameters) -> u128 {
    let mut register = parameters.init;

    for byte in bytes {
        let mut current_byte = *byte;

        for _ in 0..8 {
            let input_bit = (current_byte & 0x01) != 0;
            let register_low_bit = (register & 1) != 0;

            register >>= 1;

            if register_low_bit != input_bit {
                register ^= parameters.reflected_polynomial;
            }

            current_byte >>= 1;
        }
    }

    register & parameters.mask
}

fn normalize_parameters(
    request: &CrcCalculationRequest,
) -> Result<NormalizedCrcParameters, String> {
    let width = request.width;

    if width == 0 || width > 128 {
        return Err("CRC width must be between 1 and 128 bits.".to_string());
    }

    let mask = crc_mask(width);
    let top_bit = 1u128 << (width - 1);

    let mut polynomial = parse_integer(&request.polynomial, "polynomial")?;
    let init = parse_integer(&request.init, "initial value")?;
    let xor_out = parse_integer(&request.xor_out, "xorout value")?;

    if width < 128 {
        let full_polynomial_top_bit = 1u128 << width;

        if polynomial > mask
            && polynomial <= (full_polynomial_top_bit | mask)
            && (polynomial & full_polynomial_top_bit) != 0
        {
            polynomial &= mask;
        }
    }

    if polynomial > mask {
        return Err(format!(
            "Polynomial must fit inside {width} bits. Use the normal form without the x^{width} bit, or the full form with that leading bit."
        ));
    }

    if init > mask {
        return Err(format!("Initial value must fit inside {width} bits."));
    }

    if xor_out > mask {
        return Err(format!("Xorout value must fit inside {width} bits."));
    }

    Ok(NormalizedCrcParameters {
        width,
        polynomial,
        reflected_polynomial: reflect(polynomial, width),
        init,
        xor_out,
        reflect_in: request.reflect_in,
        reflect_out: request.reflect_out,
        mask,
        top_bit,
    })
}

fn parse_input_bytes(payload: &str, input_format: &str) -> Result<Vec<u8>, String> {
    match input_format {
        "text" => Ok(payload.as_bytes().to_vec()),
        "hex" => parse_hex_input(payload),
        "binary" => parse_binary_input(payload),
        "bytes" => parse_byte_list_input(payload),
        other => Err(format!("Unsupported input format: {other}.")),
    }
}

fn parse_hex_input(payload: &str) -> Result<Vec<u8>, String> {
    let normalized = payload
        .replace("0x", "")
        .replace("0X", "")
        .chars()
        .filter(|character| !character.is_whitespace())
        .filter(|character| ![',', '_', ':', ';', '-'].contains(character))
        .collect::<String>();

    if normalized.is_empty() {
        return Ok(Vec::new());
    }

    if !normalized.chars().all(|character| character.is_ascii_hexdigit()) {
        return Err("Hex input can only contain hexadecimal characters.".to_string());
    }

    if normalized.len() % 2 != 0 {
        return Err("Hex input must contain complete bytes. Example: 12 34 AB.".to_string());
    }

    let mut bytes = Vec::with_capacity(normalized.len() / 2);

    for index in (0..normalized.len()).step_by(2) {
        let byte = u8::from_str_radix(&normalized[index..index + 2], 16)
            .map_err(|error| format!("Invalid hex byte: {error}"))?;

        bytes.push(byte);
    }

    Ok(bytes)
}

fn parse_binary_input(payload: &str) -> Result<Vec<u8>, String> {
    let normalized = payload
        .chars()
        .filter(|character| !character.is_whitespace())
        .filter(|character| *character != '_')
        .collect::<String>();

    if normalized.is_empty() {
        return Ok(Vec::new());
    }

    if !normalized
        .chars()
        .all(|character| character == '0' || character == '1')
    {
        return Err("Binary input can only contain 0 and 1.".to_string());
    }

    if normalized.len() % 8 != 0 {
        return Err("Binary input must contain complete bytes.".to_string());
    }

    let mut bytes = Vec::with_capacity(normalized.len() / 8);

    for index in (0..normalized.len()).step_by(8) {
        let byte = u8::from_str_radix(&normalized[index..index + 8], 2)
            .map_err(|error| format!("Invalid binary byte: {error}"))?;

        bytes.push(byte);
    }

    Ok(bytes)
}

fn parse_byte_list_input(payload: &str) -> Result<Vec<u8>, String> {
    let mut bytes = Vec::new();

    for token in payload
        .split(|character: char| character.is_whitespace() || character == ',' || character == ';')
        .map(str::trim)
        .filter(|token| !token.is_empty())
    {
        let value = parse_byte_token(token)?;

        if value > 255 {
            return Err(format!("Byte \"{token}\" must be between 0 and 255."));
        }

        bytes.push(value as u8);
    }

    Ok(bytes)
}

fn parse_byte_token(token: &str) -> Result<u16, String> {
    if let Some(hex_value) = token
        .strip_prefix("0x")
        .or_else(|| token.strip_prefix("0X"))
    {
        return u16::from_str_radix(hex_value, 16)
            .map_err(|error| format!("Invalid hex byte \"{token}\": {error}"));
    }

    if token.chars().any(|character| character.is_ascii_alphabetic()) {
        return u16::from_str_radix(token, 16)
            .map_err(|error| format!("Invalid hex byte \"{token}\": {error}"));
    }

    token
        .parse::<u16>()
        .map_err(|error| format!("Invalid byte \"{token}\": {error}"))
}

fn parse_integer(value: &str, label: &str) -> Result<u128, String> {
    let normalized = value.trim().replace('_', "");

    if normalized.is_empty() {
        return Err(format!("Missing {label}."));
    }

    if let Some(decimal_value) = normalized
        .strip_prefix("dec:")
        .or_else(|| normalized.strip_prefix("DEC:"))
    {
        return decimal_value
            .parse::<u128>()
            .map_err(|error| format!("Invalid {label}: {error}"));
    }

    if let Some(binary_value) = normalized
        .strip_prefix("0b")
        .or_else(|| normalized.strip_prefix("0B"))
    {
        return u128::from_str_radix(binary_value, 2)
            .map_err(|error| format!("Invalid binary {label}: {error}"));
    }

    if let Some(hex_value) = normalized
        .strip_prefix("0x")
        .or_else(|| normalized.strip_prefix("0X"))
    {
        return u128::from_str_radix(hex_value, 16)
            .map_err(|error| format!("Invalid hex {label}: {error}"));
    }

    if normalized.chars().all(|character| character.is_ascii_hexdigit()) {
        return u128::from_str_radix(&normalized, 16)
            .map_err(|error| format!("Invalid hex {label}: {error}"));
    }

    Err(format!(
        "Invalid {label}. Use hex like 0x1021, binary like 0b1011, or decimal like dec:4129."
    ))
}

fn reflect(value: u128, width: u32) -> u128 {
    let mut reflected = 0u128;

    for bit_index in 0..width {
        let bit = 1u128 << bit_index;

        if (value & bit) != 0 {
            reflected |= 1u128 << (width - 1 - bit_index);
        }
    }

    reflected
}

fn crc_mask(width: u32) -> u128 {
    if width == 128 {
        u128::MAX
    } else {
        (1u128 << width) - 1
    }
}

fn format_hex(value: u128, width: u32) -> String {
    let digits = width.div_ceil(4).max(1) as usize;

    format!("0x{:0digits$X}", value, digits = digits)
}

fn format_binary(value: u128, width: u32) -> String {
    format!("0b{:0width$b}", value, width = width as usize)
}