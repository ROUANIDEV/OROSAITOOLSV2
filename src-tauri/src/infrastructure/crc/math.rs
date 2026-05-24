use super::parameters::CrcParameters;

pub fn compute_crc(bytes: &[u8], params: &CrcParameters) -> u64 {
    if params.reflect_in {
        compute_reflected_crc(bytes, params)
    } else {
        compute_normal_crc(bytes, params)
    }
}

pub fn reflect_bits(value: u64, width: u32) -> u64 {
    let mut result = 0u64;

    for index in 0..width {
        if ((value >> index) & 1) == 1 {
            result |= 1 << (width - 1 - index);
        }
    }

    result
}

fn compute_normal_crc(bytes: &[u8], params: &CrcParameters) -> u64 {
    let top_bit = 1u64 << (params.width - 1);
    let mut crc = params.init & params.mask;

    for byte in bytes {
        crc ^= ((*byte as u64) << params.width.saturating_sub(8)) & params.mask;

        for _ in 0..8 {
            if (crc & top_bit) != 0 {
                crc = ((crc << 1) ^ params.polynomial) & params.mask;
            } else {
                crc = (crc << 1) & params.mask;
            }
        }
    }

    finalize_crc(crc, params)
}

fn compute_reflected_crc(bytes: &[u8], params: &CrcParameters) -> u64 {
    let reflected_polynomial = reflect_bits(params.polynomial, params.width);
    let mut crc = params.init & params.mask;

    for byte in bytes {
        crc ^= *byte as u64;

        for _ in 0..8 {
            if (crc & 1) != 0 {
                crc = (crc >> 1) ^ reflected_polynomial;
            } else {
                crc >>= 1;
            }

            crc &= params.mask;
        }
    }

    finalize_crc(crc, params)
}

fn finalize_crc(mut crc: u64, params: &CrcParameters) -> u64 {
    if params.reflect_in != params.reflect_out {
        crc = reflect_bits(crc, params.width);
    }

    (crc ^ params.xor_out) & params.mask
}