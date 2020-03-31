delimiter $
create trigger human_token_expiration_trigg before insert on human_tokens
	for each row
		begin
			set new.expiration = timestampadd(week, 2, current_timestamp);
			-- update tokens set expiration = timestampadd(month, 2, current_timestamp);
		end; $
delimiter ;