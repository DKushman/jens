/** Cloudinary Delivery-URLs – Ordner „Jens“ (Cloud: dqcdbdt4v) */
const CLOUD = 'dqcdbdt4v';

export function cld(id, w = 960) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_${w}/${id}`;
}

export const media = {
  portrait: cld('Gemini_Generated_Image_filtiafiltiafilt_bngzu9', 1600),
  portrait2: cld('85A020F1-02AB-4FE5-94AE-F53D5EE585A8-photo-output_z2z8o4', 960),
  kiez: cld('F44580C3-81F6-48FC-8806-9F9599BB0F44-6c9edf6d-9b2e-4073-9621-de30320bb30a_fjzyrv', 1600),
  kiez2: cld('CCD593F3-5A9B-4F39-BFC3-C01B3EC3DC7E-IMG_1711_ssj2fj', 1600),
  bento1: 'https://res.cloudinary.com/dqcdbdt4v/image/upload/f_auto,q_auto,w_900/v1785430102/85A020F1-02AB-4FE5-94AE-F53D5EE585A8-photo-output_z2z8o4',
  bento2: 'https://res.cloudinary.com/dqcdbdt4v/image/upload/f_auto,q_auto,w_900/v1785430109/4A3E074E-2400-4255-AA19-CC462F869E44-IMG_7072_mkgcov',
  gallery: [
    cld('5B197304-60CA-4D7E-AEB7-FB71F437694D-Frau_Bindel_und_Herr_Hoffmann_fern_c7twan', 800),
    cld('728F376D-6B27-4E46-B31F-4DB22703B40F-IMG_8849_gfkyx0', 800),
    cld('5079125F-06A7-4C0A-9B18-40DFCCC0FFB4-IMG_6489_t9seca', 800),
    cld('98FC50C5-D708-4033-918F-14CD8E5B1FAF-IMG_6973_cfejfr', 800),
    cld('FA676B7E-D2AD-4F59-BAD5-211D4EC4E2D9-6c074e56-5c3a-4c46-846e-56ccc255e93a_iuqyym', 900),
    cld('0575CFA6-38FE-40E9-8E19-E26D8033AEAC-IMG_8400_ggdx4i', 800),
    cld('74F6BB4F-EF69-49C6-B307-6F24BE39439F-IMG_8181_wbo1y1', 800),
    cld('232AE707-4039-4E66-95F8-084C0EC076AB-IMG_9056_kewllt', 800),
    cld('38A1E6C6-7C85-451C-8A24-458BF667255D-IMG_1128_g7ry0k', 800),
    cld('D8762E4B-5AD3-4BC6-AFAE-16D30DA9DB7D-IMG_5990_bsrehw', 800),
    cld('BACC6B3C-8301-4707-AE55-DC38E83E664F-IMG_6169_m4ynd5', 800),
    cld('4A3E074E-2400-4255-AA19-CC462F869E44-IMG_7072_mkgcov', 900),
  ],
  spots: [
    cld('4A3E074E-2400-4255-AA19-CC462F869E44-IMG_7072_mkgcov', 560),
    cld('749026CA-224D-4556-B810-8CA3AC6C7F67-IMG_3035_vm1n0n', 560),
    cld('B23F3D89-0686-4CD7-8E47-3E06B2770915-IMG_7125_qkipkd', 560),
    cld('D31F6841-AD6F-4F02-BB0C-FC198731548D-IMG_2703_y6thnn', 560),
    cld('B7211291-0718-4410-AF25-F4B366FE3C1F-IMG_0586_tmkpzl', 560),
  ],
};
