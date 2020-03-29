delimiter $
create trigger customer_token_expiration_trigg before insert on customer_tokens
	for each row
		begin
			set new.expiration = timestampadd(month, 1, current_timestamp);
			-- update tokens set expiration = timestampadd(month, 2, current_timestamp);
		end; $
delimiter ;

delimiter $
create trigger merchant_token_expiration_trigg before insert on merchant_tokens
	for each row
		begin
			set new.expiration = timestampadd(month, 1, current_timestamp);
			-- update tokens set expiration = timestampadd(month, 2, current_timestamp);
		end; $
delimiter ;