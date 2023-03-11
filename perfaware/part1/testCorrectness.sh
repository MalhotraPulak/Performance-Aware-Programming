deno run -A decoder.ts listing_0037_single_register_mov > solution.asm
nasm solution.asm
diff solution listing_0037_single_register_mov

deno run -A decoder.ts listing_0038_many_register_mov > solution.asm
nasm solution.asm
diff solution listing_0038_many_register_mov

deno run -A decoder.ts listing_0039_more_movs > solution.asm
nasm solution.asm
diff solution listing_0039_more_movs 

deno run -A decoder.ts listing_0040_challenge_movs > solution.asm
nasm solution.asm
diff solution listing_0040_challenge_movs

nasm listing_0041_add_sub_cmp_jnz.asm
deno run -A decoder.ts listing_0041_add_sub_cmp_jnz > solution.asm
nasm solution.asm
diff solution listing_0041_add_sub_cmp_jnz
